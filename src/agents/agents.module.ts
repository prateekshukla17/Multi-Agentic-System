import { Module } from '@nestjs/common';
import { AgentOrchestrtor } from './agent-orc.service';
import { HRAgentService } from './hr-agent.service';
import { ITAgentService } from './it-agent.service';
import { OpenAIProvider } from './openai.provider';
import { GuardrailsModule } from '../guardrails/guardrails.module';
import { ToolsModule } from '../tools/tools.module';
import { OrchestratorService } from './orchestrator-agent.service';
import { ImageGenService } from './image-gen.service';
import { ChatGateway } from './chat.gateway';
@Module({
  imports: [GuardrailsModule, ToolsModule],
  providers: [
    OpenAIProvider,
    AgentOrchestrtor,
    HRAgentService,
    ITAgentService,
    OrchestratorService,
    ImageGenService,
    ChatGateway,
  ],
  exports: [AgentOrchestrtor, OpenAIProvider],
})
export class AgentModule {}
