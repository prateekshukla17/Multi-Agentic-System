import { Module } from '@nestjs/common';
import { OpenAIProvider } from '../agents/openai.provider';
import { GuardrailsService } from './guardrails.service';
import { sDKGuardrail } from './sdk-guardrails.service';

@Module({
  providers: [GuardrailsService, OpenAIProvider, sDKGuardrail],
  exports: [GuardrailsService, sDKGuardrail],
})
export class GuardrailsModule {}
