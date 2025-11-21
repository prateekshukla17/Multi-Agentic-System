import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './rag.service';
import { ToolsService } from './tools.service';

@Module({
  imports: [ConfigModule],
  providers: [RagService, ToolsService],
  exports: [ToolsService, RagService],
})
export class ToolsModule {}
