import { Test, TestingModule } from '@nestjs/testing';
import { HRAgentService } from './hr-agent.service';
import { ToolsService } from '../tools/tools.service';
import { run } from '@openai/agents';

jest.mock('@openai/agents', () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  run: jest.fn(),
  tool: jest.fn((config) => config),
}));

describe('HRAgentService', () => {
  let service: HRAgentService;
  let toolsService: jest.Mocked<ToolsService>;

  const mockTools = {
    queryLeavePolicies: {
      function: {
        name: 'query_leave_policies',
        description: 'Query leave policies',
        parameters: {},
      },
      execute: jest.fn(),
    },
    addLeaveRequest: {
      function: {
        name: 'add_leave_request',
        description: 'Add leave request',
        parameters: {},
      },
      execute: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HRAgentService,
        {
          provide: ToolsService,
          useValue: {
            getTools: jest.fn().mockReturnValue(mockTools),
          },
        },
      ],
    }).compile();

    service = module.get<HRAgentService>(HRAgentService);
    toolsService = module.get(ToolsService) as jest.Mocked<ToolsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processMessage', () => {
    it('should process a leave policy query successfully', async () => {
      const mockOutput = 'You have 15 vacation days per year';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processMessage(
        'How many vacation days do I get?',
      );

      expect(result).toBe(`[HR Agent]\n${mockOutput}`);
      expect(run).toHaveBeenCalledWith(
        service.hrAgent,
        'How many vacation days do I get?',
      );
    });

    it('should process a leave request successfully', async () => {
      const mockOutput = 'Your leave request has been submitted successfully!';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processMessage(
        'I want to request vacation leave from 2024-01-15 to 2024-01-20',
      );

      expect(result).toBe(`[HR Agent]\n${mockOutput}`);
    });

    it('should handle greeting and small talk', async () => {
      const mockOutput = 'Hello! How can I help you today?';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processMessage('Hello!');

      expect(result).toBe(`[HR Agent]\n${mockOutput}`);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'OpenAI API error';
      (run as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const result = await service.processMessage('test message');

      expect(result).toBe('Error!');
    });

    it('should handle empty finalOutput', async () => {
      (run as jest.Mock).mockResolvedValue({
        finalOutput: '',
      });

      const result = await service.processMessage('test');

      expect(result).toBe('[HR Agent]\n');
    });

    it('should handle undefined finalOutput', async () => {
      (run as jest.Mock).mockResolvedValue({});

      const result = await service.processMessage('test');

      expect(result).toBe('[HR Agent]\n');
    });
  });
});
