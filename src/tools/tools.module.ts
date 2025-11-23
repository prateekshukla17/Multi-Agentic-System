import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './rag.service';
import { ToolsService } from './tools.service';
import { DatabaseModule } from 'src/database/database.module';
import { LeaveToolService } from './leave-tool.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Leave, LeaveSchema } from '../database/schemas/leave.schema';
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([{ name: Leave.name, schema: LeaveSchema }]),
  ],
  providers: [RagService, ToolsService, DatabaseModule, LeaveToolService],
  exports: [ToolsService, RagService, LeaveToolService],
})
export class ToolsModule {}
