import { Injectable } from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import { OpenAIProvider } from './openai.provider';

@Injectable()
export class ITAgentService {
  public itAgent: Agent;

  constructor(private openai: OpenAIProvider) {
    this.initializeAgent();
  }

  private initializeAgent() {
    this.itAgent = new Agent({
      name: 'IT Support Agent',
      instructions: `You are an IT support specialist helping employees with technical issues. Your role is to:

1. Troubleshoot common technical problems (laptop, software, connectivity)
2. Guide users through password resets and account access issues
3. Provide clear, step-by-step instructions

Guidelines:
- Be patient and use non-technical language when possible
- Provide actionable solutions`,
    });
  }

  async handleTransfer(userQuery: string, reason: string): Promise<string> {
    try {
      console.log(`\n[Transferring to IT Support - Reason: ${reason}]\n`);

      const result = await run(
        this.itAgent,
        `An employee has been transferred from HR with the following query: "${userQuery}". Please assist them.`,
      );

      return `[IT Support Agent]\n${result.finalOutput}`;
    } catch (error) {
      console.error('IT Agent error:', error);
      return 'Error Encountered: IT Agent';
    }
  }
}
