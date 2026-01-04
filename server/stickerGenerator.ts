import { generateImage } from "./_core/imageGeneration";
import sharp from "sharp";

export interface GenerateStickerParams {
  referenceImageUrl: string;
  emotion: string;
  style?: string;
  bodyType?: string;
}

export interface GeneratedSticker {
  imageBuffer: Buffer;
  mimeType: string;
}

const EMOTION_PROMPTS: Record<string, string> = {
  happy: "smiling happily with a big joyful smile",
  sad: "looking sad with tears in eyes",
  angry: "looking angry with furrowed brows",
  surprised: "looking surprised with wide open eyes and mouth",
  love: "showing love with heart eyes and blushing cheeks",
  cool: "looking cool with sunglasses and confident expression",
  excited: "looking excited with sparkling eyes and energetic pose",
  tired: "looking tired with sleepy eyes and yawning",
};

/**
 * Generate a cartoon sticker from a reference photo with specified emotion
 */
const STYLE_PROMPTS: Record<string, string> = {
  cute_cartoon: "fun, colorful, kawaii anime style with big expressive eyes, simple shapes, and vibrant colors. The character should be chibi-style (small body, big head)",
  realistic_cartoon: "semi-realistic cartoon style with detailed features, natural proportions, and realistic shading while maintaining a stylized cartoon look",
  anime: "anime/manga style with large expressive eyes, detailed hair, and typical anime art characteristics",
  chibi: "super deformed chibi style with oversized head (about 1:2 head-to-body ratio), tiny body, and extremely cute simplified features",
};

const BODY_TYPE_PROMPTS: Record<string, string> = {
  half_body: "Show the character from waist up (half body portrait)",
  full_body: "Show the full body of the character from head to toe in a standing or dynamic pose",
  mixed: "Vary between half body and full body poses",
};

export async function generateSticker(params: GenerateStickerParams): Promise<GeneratedSticker> {
  const { referenceImageUrl, emotion, style = "cute_cartoon", bodyType = "half_body" } = params;

  // Get emotion-specific prompt
  const emotionPrompt = EMOTION_PROMPTS[emotion] || "with neutral expression";
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.cute_cartoon;
  const bodyTypePrompt = BODY_TYPE_PROMPTS[bodyType] || BODY_TYPE_PROMPTS.half_body;

  // Create the full prompt for AI image generation
  const prompt = `Create a cartoon sticker of a person ${emotionPrompt}. 
Art style: ${stylePrompt}. 
${bodyTypePrompt}. 
Make it suitable for messaging apps. 
The background should be transparent or white. 
Keep the facial features recognizable but stylized in the chosen art style.`;

  console.log(`[StickerGenerator] Generating sticker with emotion: ${emotion}`);
  console.log(`[StickerGenerator] Using reference image: ${referenceImageUrl}`);

  try {
    // Generate image using AI with reference photo
    const result = await generateImage({
      prompt,
      originalImages: [
        {
          url: referenceImageUrl,
          mimeType: "image/jpeg",
        },
      ],
    });

    if (!result.url) {
      throw new Error("Failed to generate image: No URL returned");
    }

    const generatedImageUrl = result.url;
    console.log(`[StickerGenerator] AI generated image: ${generatedImageUrl}`);

    // Download the generated image
    const response = await fetch(generatedImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download generated image: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Process image with sharp to ensure it meets Telegram requirements
    const processedBuffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .png() // Convert to PNG for transparency support
      .toBuffer();

    console.log(`[StickerGenerator] Sticker generated successfully, size: ${processedBuffer.length} bytes`);

    return {
      imageBuffer: processedBuffer,
      mimeType: "image/png",
    };
  } catch (error) {
    console.error("[StickerGenerator] Error generating sticker:", error);
    throw new Error(`Failed to generate sticker: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate multiple stickers for different emotions
 */
export async function generateStickerBatch(
  referenceImageUrl: string,
  emotions: string[],
  style: string = "cute_cartoon",
  bodyType: string = "half_body"
): Promise<Map<string, GeneratedSticker>> {
  const results = new Map<string, GeneratedSticker>();

  // Generate stickers sequentially to avoid overwhelming the API
  for (const emotion of emotions) {
    try {
      const sticker = await generateSticker({
        referenceImageUrl,
        emotion,
        style,
        bodyType,
      });
      results.set(emotion, sticker);
      console.log(`[StickerGenerator] Generated sticker for emotion: ${emotion}`);
    } catch (error) {
      console.error(`[StickerGenerator] Failed to generate sticker for emotion ${emotion}:`, error);
      // Continue with other emotions even if one fails
    }
  }

  return results;
}
