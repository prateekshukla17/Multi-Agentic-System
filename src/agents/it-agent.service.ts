import { Injectable } from '@nestjs/common';
import { Agent, run, tool } from '@openai/agents';
import { ToolsService } from 'src/tools/tools.service';

@Injectable()
export class ITAgentService {
  public itAgent: Agent;

  constructor(private toolsService: ToolsService) {
    this.initializeAgent();
  }

  private initializeAgent() {
    const tools = this.toolsService.getTools();
    this.itAgent = new Agent({
      name: 'IT Support Agent',
      instructions: `You are an IT support specialist helping employees with technical issues. Your role is to:

1. Troubleshoot common technical problems (laptop, software, connectivity)
2. Guide users through password resets and account access issues
3. Provide clear, step-by-step instructions
4. When the user wants to raise a ticket to the IT department, use the raise_ticket tool.

Guidelines:
- Be patient and use non-technical language when possible
- Provide actionable solutions`,
      // tools: [
      //   tool({
      //     name: tools.raiseTicket.function.name,
      //     description: tools.raiseTicket.function.description,
      //     parameters: tools.raiseTicket.function.parameters as any,
      //     execute: tools.raiseTicket.execute,
      //   }),
      // ],
    });
  }

  async handleTransfer(userQuery: string): Promise<string> {
    try {
      const result = await run(this.itAgent, userQuery);
      const output = result.finalOutput || '';

      return `[IT Support Agent]\n${output}`;
    } catch (error) {
      console.error('IT Agent error:', error);
      return 'Error Encountered: IT Agent';
    }
  }
}
