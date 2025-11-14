import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from 'src/agents/openai.provider';

interface SafetyCheckResult {
  passed: boolean;
  message: string;
}

@Injectable()
export class GuardrailsService {
  constructor(private openai: OpenAIProvider) {}

  async checkInput(input: string): Promise<SafetyCheckResult> {
    try {
      const response = await this.openai.client.moderations.create({
        input: input,
      });

      const result = response.results[0];

      if (result.flagged) {
        return {
          passed: false,
          message: `I cannot process this request. It contains inappropriate content. Please rephrase your question.`,
        };
      }

      return {
        passed: true,
        message: 'Input is safe',
      };
    } catch (error) {
      console.error('Input guardrail error:', error);

      return {
        passed: true,
        message: 'Safety check skipped',
      };
    }
  }

  async checkOutput(output: string): Promise<SafetyCheckResult> {
    try {
      const response = await this.openai.client.moderations.create({
        input: output,
      });

      const result = response.results[0];

      if (result.flagged) {
        return {
          passed: false,
          message: `I apologize, but I cannot provide this response. It contains inappropriate content. Please ask a different question.`,
        };
      }

      return {
        passed: true,
        message: 'Output is safe',
      };
    } catch (error) {
      console.error('Output guardrail error:', error);
      return {
        passed: true,
        message: 'Safety check skipped',
      };
    }
  }
}
