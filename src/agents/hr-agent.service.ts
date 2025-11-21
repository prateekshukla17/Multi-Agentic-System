import { Injectable } from '@nestjs/common';
import { Agent, run, tool } from '@openai/agents';
import { ITAgentService } from './it-agent.service';
import { ToolsService } from '../tools/tools.service';

@Injectable()
export class HRAgentService {
  public hrAgent: Agent;

  constructor(
    private itagent: ITAgentService,
    private toolsService: ToolsService,
  ) {
    this.initalisizeAgent();
  }

  initalisizeAgent() {
    const tools = this.toolsService.getTools();

    this.hrAgent = new Agent({
      name: 'HR-Assistant',
      instructions: `You are a friendly and professional HR assistant for the company. Your role is to:

1. Engage in warm, professional small talk with employees
2. Answer questions about company policies, benefits, and HR matters
3. Provide accurate information based on company policy documents
4. Be empathetic and supportive when employees discuss workplace issues

Guidelines:
- Keep responses concise and friendly
- For leave-related questions (vacation, sick leave, time off, parental leave, etc.), ALWAYS use the queryLeavePolicies tool to get accurate information from the company's leave policies database
- If you don't know something and there's no tool available, admit it.
- For IT-related queries (technical issues, laptop problems, software, passwords), respond with: "[TRANSFER_TO_IT]" followed by a brief explanation of why the user should contact IT support.`,
      tools: [
        tool({
          name: tools.queryLeavePolicies.function.name,
          description: tools.queryLeavePolicies.function.description,
          parameters: tools.queryLeavePolicies.function.parameters as any,
          execute: tools.queryLeavePolicies.execute,
        }),
      ],
    });
  }

  async processMessage(userMessage: string): Promise<string> {
    try {
      const result = await run(this.hrAgent, userMessage);
      const output = result.finalOutput || '';

      if (output.includes('[TRANSFER_TO_IT]')) {
        const itResponse = await this.itagent.handleTransfer(
          userMessage,
          'HR Agent transfer - IT-related query',
        );
        return itResponse;
      }

      return output;
    } catch (error) {
      console.error('Error in HR agent:', error);
      return `Error!`;
    }
  }
}
