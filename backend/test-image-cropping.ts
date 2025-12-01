import {
  processImage,
  detectSubjectForCropping,
  cropImage,
} from "./utils/imageProcessor";
import path from "path";
import fs from "fs";

/**
 * Test script for image cropping functionality
 * Run with: npx tsx test-image-cropping.ts
 */

async function testImageCropping() {
  console.log("🧪 Testing Image Cropping Functionality...\n");

  // Test 1: Basic image processing (compression only)
  console.log("📦 Test 1: Basic Image Compression");
  try {
    const testImagePath = path.join(process.cwd(), "test-sample.jpg");

    // Check if test image exists
    if (!fs.existsSync(testImagePath)) {
      console.log("⚠️  Test image not found. Skipping compression test.");
    }

    if (fs.existsSync(testImagePath)) {
      const outputPath = path.join(process.cwd(), "test-output-compressed.jpg");

      const result = await processImage(testImagePath, outputPath, {
        quality: 80,
        maxWidth: 800,
        maxHeight: 600,
      });

      if (result.success) {
        console.log("✅ Compression test passed");
        console.log(`   Original size: ${result.metadata?.originalSize} bytes`);
        console.log(
          `   Processed size: ${result.metadata?.processedSize} bytes`
        );
        console.log(
          `   Compression ratio: ${result.metadata?.compressionRatio?.toFixed(
            2
          )}`
        );
        console.log(
          `   Dimensions: ${result.metadata?.dimensions.width}x${result.metadata?.dimensions.height}`
        );
      } else {
        console.log("❌ Compression test failed:", result.error);
      }

      // Clean up
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {
        // ignore cleanup errors
      }
    }
  } catch (error) {
    console.log("❌ Compression test error:", error);
  }

  // Test 2: Subject detection (requires OpenAI API key)
  console.log("\n🎯 Test 2: Subject Detection");
  try {
    const testImagePath = path.join(process.cwd(), "test-sample.jpg");

    if (fs.existsSync(testImagePath)) {
      console.log("🔍 Detecting subject in test image...");

      const cropOptions = await detectSubjectForCropping(testImagePath);

      if (cropOptions) {
        console.log("✅ Subject detection successful");
        console.log(
          `   Crop coordinates: left=${cropOptions.left}, top=${cropOptions.top}`
        );
        console.log(
          `   Crop dimensions: ${cropOptions.width}x${cropOptions.height}`
        );
      } else {
        console.log(
          "⚠️  Subject detection returned no results (may be due to API limits or image content)"
        );
      }
    } else {
      console.log("⚠️  Skipping subject detection test (no test image)");
    }
  } catch (error) {
    console.log("❌ Subject detection test error:", error);
  }

  // Test 2.5: Direct cropImage function test
  console.log("\n✂️  Test 2.5: Direct Crop Function");
  try {
    const testImagePath = path.join(process.cwd(), "test-sample.jpg");

    if (fs.existsSync(testImagePath)) {
      const outputPath = path.join(
        process.cwd(),
        "test-output-direct-crop.jpg"
      );

      // Test cropping with fixed coordinates (center crop)
      const cropOptions = {
        left: 0.25, // 25% from left
        top: 0.25, // 25% from top
        width: 0.5, // 50% width
        height: 0.5, // 50% height
      };

      console.log("🔄 Testing direct crop function...");

      const result = await cropImage(testImagePath, outputPath, cropOptions);

      if (result.success) {
        console.log("✅ Direct crop test passed");
        console.log(`   Output saved to: ${outputPath}`);
        console.log(
          `   Cropped dimensions: ${result.metadata?.dimensions.width}x${result.metadata?.dimensions.height}`
        );
      } else {
        console.log("❌ Direct crop test failed:", result.error);
      }

      // Clean up
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {
        // ignore cleanup errors
      }
    } else {
      console.log("⚠️  Skipping direct crop test (no test image)");
    }
  } catch (error) {
    console.log("❌ Direct crop test error:", error);
  }

  // Test 3: Full cropping pipeline
  console.log("\n✂️  Test 3: Full Cropping Pipeline");
  try {
    const testImagePath = path.join(process.cwd(), "test-sample.jpg");

    if (fs.existsSync(testImagePath)) {
      const outputPath = path.join(process.cwd(), "test-output-cropped.jpg");

      console.log("🔄 Processing image with compression + cropping...");

      const result = await processImage(testImagePath, outputPath);

      if (result.success) {
        console.log("✅ Full cropping pipeline test passed");
        console.log(`   Output saved to: ${outputPath}`);
        console.log(
          `   Final dimensions: ${result.metadata?.dimensions.width}x${result.metadata?.dimensions.height}`
        );
      } else {
        console.log("❌ Full cropping pipeline test failed:", result.error);
      }

      // Clean up
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {
        // ignore cleanup errors
      }
    } else {
      console.log("⚠️  Skipping full pipeline test (no test image)");
    }
  } catch (error) {
    console.log("❌ Full cropping pipeline test error:", error);
  }

  // Test 4: Error handling
  console.log("\n🛡️  Test 4: Error Handling");
  try {
    const result = await processImage("/nonexistent/path.jpg", "/output.jpg");

    if (!result.success) {
      console.log(
        "✅ Error handling test passed (correctly handled invalid input)"
      );
    } else {
      console.log(
        "❌ Error handling test failed (should have failed with invalid input)"
      );
    }
  } catch (error) {
    console.log("✅ Error handling test passed (threw expected error)");
  }

  // Clean up test image
  try {
    const testImagePath = path.join(process.cwd(), "test-sample.jpg");
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log("\n🧹 Cleaned up test files");
    }
  } catch (e) {
    // ignore cleanup errors
  }

  console.log("\n🎉 Image cropping tests completed!");
  console.log(
    "\n📝 Note: For full AI cropping functionality, ensure OPENAI_API_KEY is set in your environment."
  );
  console.log(
    "💡 The system will gracefully fall back to compression-only if AI features are unavailable."
  );
}

// Run the tests
testImageCropping().catch(console.error);
