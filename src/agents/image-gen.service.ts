import { Injectable } from '@nestjs/common';
import { Agent, run, tool } from '@openai/agents';
import { ToolsService } from '../tools/tools.service';

@Injectable()
export class ImageGenService {
  public imageAgent: Agent;

  constructor(private toolsService: ToolsService) {
    this.initalisizeAgent();
  }
}
