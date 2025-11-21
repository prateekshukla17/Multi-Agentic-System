import { Injectable } from '@nestjs/common';
import { RagService } from './rag.service';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

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
  constructor(private ragService: RagService) {}

  getTools() {
    return {
      queryLeavePolicies: this.getQueryLeavePolicyTool(),
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
- Leave request procedures
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

  async executeTool(toolName: string, args: any): Promise<string> {
    const tools = this.getTools();

    switch (toolName) {
      case 'query_leave_policies':
        return await tools.queryLeavePolicies.execute(args);
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
