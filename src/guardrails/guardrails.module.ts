import { Module } from '@nestjs/common';
import { OpenAIProvider } from '../agents/openai.provider';
import { GuardrailsService } from './guardrails.service';

@Module({
  providers: [GuardrailsService, OpenAIProvider],
  exports: [GuardrailsService],
})
export class GuardrailsModule {}
