import { Injectable } from '@nestjs/common';
import { Agent, run, tool } from '@openai/agents';
import { ToolsService } from '../tools/tools.service';

@Injectable()
export class ImageGenService {
  public imageAgent: Agent;

  constructor(private toolsService: ToolsService) {
    this.initalisizeAgent();
  }

  initalisizeAgent() {
    const tools = this.toolsService.getTools();
    this.imageAgent = new Agent({
      name: 'Image-Generator',
      instructions: `You are an AI image generation assistant. Your role is to:

1. Understand user requests for images based on descriptions provided.
2. Use the generateImage tool to create images that match the user's description.
3. Provide concise and clear responses about the generated images.

Guidelines:
- Always use the generateImage tool to fulfill image requests.
- If you don't know something and there's no tool available, admit it.`,
      tools: [
        tool({
          name: tools.generateImg.function.name,
          description: tools.generateImg.function.description,
          parameters: tools.generateImg.function.parameters as any,
          execute: tools.generateImg.execute,
        }),
      ],
    });
  }
  async processMessage(userMessage: string): Promise<string> {
    try {
      console.log('Image Generator Agent processing:', userMessage);

      const result = await run(this.imageAgent, userMessage);
      const output = result.finalOutput || '';

      console.log('Image generation completed');

      return `[Image Generator]\n${output}`;
    } catch (error) {
      console.error('Error in Image Generator agent:', error);
      return `Error generating image: ${error.message}`;
    }
  }
}
