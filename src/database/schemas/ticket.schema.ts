import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import tr from 'zod/v4/locales/tr.js';

export type TicketDocument = HydratedDocument<Ticket>;

export enum TicketStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
}

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true })
  ticketId: Number;
  @Prop({ required: true })
  employeeName: String;
  @Prop({ required: true })
  raiseDate: Date;
  @Prop({ required: true })
  query: String;
  @Prop({ required: true })
  status: TicketStatus;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
