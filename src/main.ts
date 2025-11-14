import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AgentOrchestrtor } from './agents/agent-orc.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const orchestrator = app.get(AgentOrchestrtor);

  console.log('Agent is live!');

  orchestrator.startConversation();

  process.on('SIGINT', () => {
    console.log('\n Goodbye!');
    void (async () => {
      await app.close();
      process.exit(0);
    })();
  });
}

void bootstrap();
