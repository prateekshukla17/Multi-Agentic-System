import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import axios from 'axios';
import { OpenAIProvider } from 'src/agents/openai.provider';
import * as path from 'path';
import * as fs from 'fs';

const GenerateImageSchema = z.object({
  prompt: z.string().describe('The description of the image to generate'),
  size: z
    .enum(['1024x1024', '1792x1024', '1024x1792'])
    .optional()
    .default('1024x1024'),
  quality: z.enum(['standard', 'hd']).optional().default('standard'),
});

type GenerateImageInput = z.infer<typeof GenerateImageSchema>;

type ImgOutput = {
  success: boolean;
  message: string;
  imagePath?: string;
  imageUrl?: string;
};

@Injectable()
export class ImgToolService {
  private imagesDir: string;

  constructor(private openaiProvider: OpenAIProvider) {
    this.imagesDir = path.join(process.cwd(), 'generated_images');
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  async generateImage(input: GenerateImageInput): Promise<ImgOutput> {
    try {
      const response = await this.openaiProvider.client.images.generate({
        model: 'dall-e-3',
        prompt: input.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      });

      const imageUrl =
        response.data && response.data[0] && response.data[0].url;
      if (!imageUrl) {
        throw new Error('No image URL returned');
      }

      const imagePath = await this.downloadImage(imageUrl, 'generated');
      console.log(`Image generatd:${imagePath}`);

      return {
        success: true,
        message: `Image generated successfully! Saved at: ${imagePath}`,
        imagePath,
        imageUrl,
      };
    } catch (error) {
      console.error('Error generating image:', error);
      return {
        success: false,
        message: `Failed to generate image: ${error.message}`,
      };
    }
  }

  private async downloadImage(url: string, prefix: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `${prefix}_${timestamp}.png`;
    const filepath = path.join(this.imagesDir, filename);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filepath, response.data);
    return filepath;
  }
}
