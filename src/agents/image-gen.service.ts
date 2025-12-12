import { Injectable } from '@nestjs/common';
import { Agent, run, tool } from '@openai/agents';
import { ToolsService } from '../tools/tools.service';
import axios from 'axios';

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
      tools: [],
    });
  }
}
