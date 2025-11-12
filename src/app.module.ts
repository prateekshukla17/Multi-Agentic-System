import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentsModule } from './agents/agents.module';
import { ChatModule } from './chat/chat.module';
import { ToolsModule } from './tools/tools.module';
import { GuardrailsModule } from './guardrails/guardrails.module';
import { VectorStoreModule } from './vector-store/vector-store.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [AgentsModule, ToolsModule, GuardrailsModule, VectorStoreModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
