import { Injectable } from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import { ITAgentService } from './it-agent.service';

@Injectable()
export class HRAgentService {
  private hrAgent: Agent;

  constructor(private itagent: ITAgentService) {
    this.initalisizeAgent();
  }

  initalisizeAgent() {
    this.hrAgent = new Agent({
      name: 'HR-Assistant',
      instructions: `You are a friendly and professional HR assistant for the company. Your role is to:

1. Engage in warm, professional small talk with employees
2. Answer questions about company policies, benefits, and HR matters
3. Provide accurate information based on company policy documents
4. Be empathetic and supportive when employees discuss workplace issues

Guidelines:
- Keep responses concise and friendly
- If you don't know something, admit it and suggest contacting HR directly
- Stay professional and avoid legal advice
- For IT-related queries (technical issues, laptop problems, software, passwords), respond with: "[TRANSFER_TO_IT]" followed by a brief explanation of why the user should contact IT support.`,
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
