import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export async function generateVirtualTryOn(
  customerImageBase64: string,
  productImageBase64: string,
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
              image_url: { url: `data:image/jpeg;base64,${customerImageBase64}` }
            },
            {
              type: "image_url", 
              image_url: { url: `data:image/jpeg;base64,${productImageBase64}` }
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

  } catch (error) {
    console.error('Virtual try-on error:', error);
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