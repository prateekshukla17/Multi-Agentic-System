import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './rag.service';
import { ToolsService } from './tools.service';
import { DatabaseModule } from 'src/database/database.module';
import { LeaveToolService } from './leave-tool.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Leave, LeaveSchema } from '../database/schemas/leave.schema';
import { Ticket, TicketSchema } from 'src/database/schemas/ticket.schema';
import { RaiseTicketService } from './ticket.service';
import { ImgToolService } from './imgTool.service';
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Leave.name, schema: LeaveSchema },
      { name: Ticket.name, schema: TicketSchema },
    ]),
  ],
  providers: [
    RagService,
    ToolsService,
    DatabaseModule,
    LeaveToolService,
    RaiseTicketService,
    ImgToolService,
  ],
  exports: [
    ToolsService,
    RagService,
    LeaveToolService,
    RaiseTicketService,
    ImgToolService,
  ],
})
export class ToolsModule {}
