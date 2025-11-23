import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { error } from 'console';
import { Model } from 'mongoose';
import {
  Ticket,
  TicketDocument,
  TicketStatus,
} from 'src/database/schemas/ticket.schema';
import { z } from 'zod';

export const RaiseTicketSchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required'),
  Query: z.string().min(1, 'Query is required'),
});

export type raiseTicketInput = z.infer<typeof RaiseTicketSchema>;

type ticketOuput = {
  success: boolean;
  message: string;
};

@Injectable()
export class RaiseTicketService {
  constructor(
    @InjectModel(Ticket.name) private RaiseticketModel: Model<TicketDocument>,
  ) {}

  async raiseTicket(input: raiseTicketInput): Promise<ticketOuput> {
    try {
      const validateInput = RaiseTicketSchema.parse(input);

      const ticket = new this.RaiseticketModel({
        employeeName: validateInput.employeeName,
        query: validateInput.Query || '',
        status: TicketStatus.PENDING,
      });

      const savedTicket = await ticket.save();
      return {
        success: true,
        message: 'Your ticket has been raised',
      };
    } catch (Error) {
      console.error('Error raising a ticket:', error);
      return {
        success: false,
        message: `Error raising your ticket ${Error.message}`,
      };
    }
  }
}
