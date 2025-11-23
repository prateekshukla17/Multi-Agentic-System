import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agents/agents.module';
import { GuardrailsModule } from './guardrails/guardrails.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AgentModule,
    GuardrailsModule,
    DatabaseModule,
  ],
})
export class AppModule {}
