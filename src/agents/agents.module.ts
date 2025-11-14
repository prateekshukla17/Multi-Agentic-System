import { Module } from '@nestjs/common';
import { AgentOrchestrtor } from './agent-orc.service';
import { HRAgentService } from './hr-agent.service';
import { ITAgentService } from './it-agent.service';
import { OpenAIProvider } from './openai.provider';
import { GuardrailsModule } from '../guardrails/guardrails.module';

@Module({
  imports: [GuardrailsModule],
  providers: [OpenAIProvider, AgentOrchestrtor, HRAgentService, ITAgentService],
  exports: [AgentOrchestrtor],
})
export class AgentModule {}
