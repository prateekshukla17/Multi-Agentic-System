import { Injectable } from '@nestjs/common';
import { RagService } from './rag.service';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LeaveToolService } from './leave-tool.service';
import type { AddLeaveInput } from './leave-tool.service';
import { RaiseTicketService, raiseTicketInput } from './ticket.service';

const leavePolicyQuerySchema = z.object({
  question: z
    .string()
    .describe('The question about leave policies to search for'),
  topResults: z
    .number()
    .optional()
    .default(5)
    .describe('Number of top results to return (default: 5)'),
});

@Injectable()
export class ToolsService {
  constructor(
    private ragService: RagService,
    private leaveService: LeaveToolService,
    private ticketService: RaiseTicketService,
  ) {}

  getTools() {
    return {
      queryLeavePolicies: this.getQueryLeavePolicyTool(),
      addLeaveRequest: this.getLeaveTool(),
      raiseTicket: this.getTicketTool(),
    };
  }
  private getTicketTool() {
    return {
      type: 'function' as const,
      function: {
        name: 'raise_ticket',
        description:
          'Raise a IT query ticket to the system. Use this when an employee wants to raise a ticket related to IT',
        parameters: {
          type: 'object',
          properties: {
            employeeName: {
              type: 'string',
              description:
                'This is the name of the Employee Raising the ticket',
            },
            query: {
              type: 'string',
              description:
                'This is the query of the employee for which they are raising the ticket',
            },
          },
          required: ['employeeName', 'query'],
          additionalProperties: false,
        },
      },
      execute: async (input: raiseTicketInput) => {
        return await this.ticketService.raiseTicket(input);
      },
    };
  }
  private getLeaveTool() {
    return {
      type: 'function' as const,
      function: {
        name: 'add_leave_request',
        description:
          'Add a new leave request to the system. Use this when an employee wants to apply for a leave.',
        parameters: {
          type: 'object',
          properties: {
            employeeName: {
              type: 'string',
              description: 'This is the name of the employee',
            },
            leaveType: {
              type: 'string',
              enum: ['sick', 'vacation', 'personal', 'unpaid'],
              description: 'The type of leave being requested',
            },
            startDate: {
              type: 'string',
              description: 'Start date of leave in YYYY-MM-DD format',
            },
            endDate: {
              type: 'string',
              description: 'End date of leave in YYYY-MM-DD format',
            },
            reason: {
              type: 'string',
              description: 'Optional reason for the leave request',
            },
          },
          required: [
            'employeeName',
            'leaveType',
            'startDate',
            'endDate',
            'reason',
          ],
          additionalProperties: false,
        },
      },
      execute: async (input: AddLeaveInput) => {
        return await this.leaveService.addLeaveRequest(input);
      },
    };
  }

  private getQueryLeavePolicyTool() {
    return {
      type: 'function' as const,
      function: {
        name: 'query_leave_policies',
        description: `Search the company's leave policies database for information about vacation time, sick leave, parental leave, time off policies, leave accrual, leave approval processes, and other leave-related policies. This tool uses RAG (Retrieval Augmented Generation) to find the most relevant policy information based on the question.
        
Use this tool when employees ask about:
- How many vacation days they get
- Sick leave policies
- Parental leave information
- Holiday schedules
- Any other leave related questions`,
        parameters: {
          ...zodToJsonSchema(leavePolicyQuerySchema),
          required: ['question', 'topResults'],
        },
      },
      execute: async (args: z.infer<typeof leavePolicyQuerySchema>) => {
        const { question, topResults } = leavePolicyQuerySchema.parse(args);
        return await this.ragService.queryLeavePolicies(question, topResults);
      },
    };
  }

  async executeTool(toolName: string, args: any): Promise<any> {
    const tools = this.getTools();

    switch (toolName) {
      case 'query_leave_policies':
        return await tools.queryLeavePolicies.execute(args);
      case 'add_leave_request':
        return await tools.addLeaveRequest.execute(args);
      case 'raise_ticket':
        return await tools.raiseTicket.execute(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
  getToolDefinitions() {
    const tools = this.getTools();
    return Object.values(tools).map((tool) => ({
      type: tool.type,
      function: tool.function,
    }));
  }
}
