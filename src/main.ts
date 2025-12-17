import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AgentOrchestrtor } from './agents/agent-orc.service';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.useStaticAssets(path.join(__dirname, '..', 'generated_images'), {
    prefix: '/generated_images',
  });

  const port = 3000;
  await app.listen(port);

  console.log('Server is running!');
}
bootstrap();
