import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agents/agents.module';
import { GuardrailsModule } from './guardrails/guardrails.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AgentModule,
    GuardrailsModule,
  ],
})
export class AppModule {}
