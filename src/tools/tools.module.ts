import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './rag.service';
import { ToolsService } from './tools.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [RagService, ToolsService, DatabaseModule],
  exports: [ToolsService, RagService],
})
export class ToolsModule {}
