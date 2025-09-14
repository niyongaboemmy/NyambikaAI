import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEMO_TRYON_FALLBACK = (process.env.DEMO_TRYON_FALLBACK || "").toLowerCase() === "true";

export interface VirtualTryOnResult {
  success: boolean;
  tryOnImageUrl?: string;
  recommendations?: {
    fit: 'perfect' | 'loose' | 'tight';
    confidence: number;
    suggestedSize?: string;
    notes: string;
  };
  error?: string;
}

function removeDataUrlPrefix(data: string): string {
  const match = data.match(/^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i);
  return match ? match[2] : data;
}

async function toBase64FromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}

export async function generateVirtualTryOn(
  customerImageBase64OrUrl: string,
  productImageBase64OrUrl: string,
  productType: string,
  customerMeasurements?: {
    height?: number;
    weight?: number;
    chestCircumference?: number;
    waistCircumference?: number;
    hipCircumference?: number;
  }
): Promise<VirtualTryOnResult> {
  try {
    // Normalize inputs to raw base64 (no data URL prefix)
    let customerBase64 = customerImageBase64OrUrl;
    let productBase64 = productImageBase64OrUrl;

    // If inputs are data URLs, strip prefix; if http(s), fetch and convert
    if (/^data:image\//i.test(customerBase64)) {
      customerBase64 = removeDataUrlPrefix(customerBase64);
    }
    if (/^https?:\/\//i.test(customerBase64)) {
      customerBase64 = await toBase64FromUrl(customerBase64);
    }

    if (/^data:image\//i.test(productBase64)) {
      productBase64 = removeDataUrlPrefix(productBase64);
    }
    if (/^https?:\/\//i.test(productBase64)) {
      productBase64 = await toBase64FromUrl(productBase64);
    }
    // If demo fallback is enabled or API key missing, return mocked result
    if (DEMO_TRYON_FALLBACK || !process.env.OPENAI_API_KEY) {
      return {
        success: true,
        tryOnImageUrl: `data:image/jpeg;base64,${customerBase64}`,
        recommendations: {
          fit: 'perfect',
          confidence: 0.75,
          suggestedSize: 'M',
          notes: `Demo mode: estimated fit for ${productType}.`
        }
      };
    }

    // Analyze customer body type and measurements
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI fashion expert specializing in virtual try-on technology and size recommendations. 
          Analyze the customer photo and clothing item to provide accurate fit recommendations.
          Consider body proportions, clothing type, and measurements if provided.
          Respond with JSON in this format: 
          {
            "bodyAnalysis": {
              "bodyType": "string",
              "shoulderWidth": "narrow|medium|broad",
              "height": "short|medium|tall",
              "build": "slim|medium|athletic|plus"
            },
            "fitRecommendation": {
              "fit": "perfect|loose|tight",
              "confidence": number,
              "suggestedSize": "XS|S|M|L|XL|XXL",
              "notes": "detailed explanation"
            },
            "virtualTryOnDescription": "detailed description of how the clothing would look on this person"
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this customer photo and clothing item for virtual try-on. 
              Product type: ${productType}
              ${customerMeasurements ? `Customer measurements: ${JSON.stringify(customerMeasurements)}` : ''}
              Provide fit analysis and size recommendations.`
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${customerBase64}` }
            },
            {
              type: "image_url", 
              image_url: { url: `data:image/jpeg;base64,${productBase64}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');

    // Generate virtual try-on image description for DALL-E
    const imagePrompt = `Create a realistic virtual try-on image showing a person wearing ${productType}. 
    ${analysis.virtualTryOnDescription || 'Show the clothing fitted appropriately on the person.'}
    Style: Professional fashion photography, clean background, focus on fit and appearance.
    Make it look natural and realistic.`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    return {
      success: true,
      tryOnImageUrl: imageResponse.data?.[0]?.url || '',
      recommendations: {
        fit: analysis.fitRecommendation?.fit || 'perfect',
        confidence: analysis.fitRecommendation?.confidence || 0.8,
        suggestedSize: analysis.fitRecommendation?.suggestedSize || 'M',
        notes: analysis.fitRecommendation?.notes || 'AI-generated size recommendation'
      }
    };

  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('Virtual try-on error:', msg);

    // Fallback on common quota/rate errors for demo friendliness
    if (DEMO_TRYON_FALLBACK || /429|quota|insufficient/i.test(msg)) {
      // We cannot guarantee we still have the normalized base64 here, so return a generic placeholder
      // but we can instruct client to use original image as a visual fallback.
      return {
        success: true,
        tryOnImageUrl: undefined,
        recommendations: {
          fit: 'perfect',
          confidence: 0.7,
          suggestedSize: 'M',
          notes: 'Demo fallback used due to AI quota limits. Visual uses your uploaded image as-is.'
        },
        error: 'AI quota exceeded; returned demo fallback'
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate virtual try-on'
    };
  }
}

export async function analyzeFashionImage(imageBase64: string): Promise<{
  category: string;
  colors: string[];
  style: string;
  description: string;
  tags: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a fashion AI expert. Analyze clothing images and provide detailed categorization.
          Respond with JSON in this format:
          {
            "category": "shirts|dresses|pants|shoes|accessories|etc",
            "colors": ["color1", "color2"],
            "style": "casual|formal|business|athletic|trendy|etc",
            "description": "detailed description",
            "tags": ["tag1", "tag2", "tag3"]
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this fashion item and provide categorization details."
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    throw new Error('Failed to analyze fashion image');
  }
}

export async function generateSizeRecommendation(
  measurements: {
    height: number;
    weight: number;
    chestCircumference?: number;
    waistCircumference?: number;
    hipCircumference?: number;
  },
  productType: string,
  productSizes: string[]
): Promise<{
  recommendedSize: string;
  confidence: number;
  alternatives: string[];
  notes: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional fashion sizing expert. Based on customer measurements and product type,
          recommend the best size from available options. Consider international sizing standards.
          Respond with JSON in this format:
          {
            "recommendedSize": "size",
            "confidence": number,
            "alternatives": ["size1", "size2"],
            "notes": "explanation of recommendation"
          }`
        },
        {
          role: "user",
          content: `Customer measurements: ${JSON.stringify(measurements)}
          Product type: ${productType}
          Available sizes: ${productSizes.join(', ')}
          Recommend the best size and provide alternatives.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    throw new Error('Failed to generate size recommendation');
  }
}

// Suggest concise product titles in English and Kinyarwanda from an image URL
// Returns a short, marketable name (3-6 words), plus a couple of alternatives when available
export async function suggestProductTitles(
  imageUrl: string,
  opts?: { categoryHint?: string }
): Promise<{
  nameEn: string;
  nameRw: string;
  alternativesEn?: string[];
  alternativesRw?: string[];
  rationale?: string;
}> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('imageUrl is required');
  }

  // If demo mode or no key, return a safe, generic fallback
  if (DEMO_TRYON_FALLBACK || !process.env.OPENAI_API_KEY) {
    const base = opts?.categoryHint?.toLowerCase().includes('dress')
      ? 'Elegant Traditional Dress'
      : opts?.categoryHint?.toLowerCase().includes('shirt')
      ? 'Classic Casual Shirt'
      : 'Stylish Fashion Item';
    const baseRw = opts?.categoryHint?.toLowerCase().includes('dress')
      ? 'Ikanzu Nyarwanda Nziza'
      : opts?.categoryHint?.toLowerCase().includes('shirt')
      ? 'Ishati Yoroheje'
      : 'Igikoresho cya Moda';
    return {
      nameEn: base,
      nameRw: baseRw,
      alternativesEn: [base + ' Pro', 'Modern ' + base.split(' ')[0]],
      alternativesRw: [baseRw + ' Y’Ubukwe', 'Igishushanyo Gishya'],
      rationale: 'Demo mode: generic suggestion without AI vision.',
    };
  }

  const system = `You are an AI fashion merchandiser for an e-commerce app in Rwanda.
Generate concise, marketable product titles from an image.
Rules:
- Output JSON only.
- Keep titles short (3-6 words), no brand names, no emojis.
- Provide English and Kinyarwanda versions.
- If a category hint is given, align titles with it.
- Avoid ALL CAPS; use Title Case for English.
JSON format:
{
  "nameEn": string,
  "nameRw": string,
  "alternativesEn": string[],
  "alternativesRw": string[],
  "rationale": string
}`;

  const userText = `Suggest concise titles from this image.
${opts?.categoryHint ? `Category hint: ${opts.categoryHint}` : ''}`.trim();

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 500,
  });

  try {
    const json = JSON.parse(resp.choices[0].message.content || '{}');
    // Minimal validation with sensible defaults
    return {
      nameEn: String(json.nameEn || 'Stylish Fashion Item'),
      nameRw: String(json.nameRw || 'Igikoresho cya Moda'),
      alternativesEn: Array.isArray(json.alternativesEn) ? json.alternativesEn : [],
      alternativesRw: Array.isArray(json.alternativesRw) ? json.alternativesRw : [],
      rationale: typeof json.rationale === 'string' ? json.rationale : undefined,
    };
  } catch (e) {
    // If the model failed to return JSON, provide a graceful fallback
    return {
      nameEn: 'Stylish Fashion Item',
      nameRw: 'Igikoresho cya Moda',
      alternativesEn: [],
      alternativesRw: [],
      rationale: 'Fallback used due to JSON parse error',
    };
  }
}