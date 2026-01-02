import { Test, TestingModule } from '@nestjs/testing';
import { ITAgentService } from './it-agent.service';
import { ToolsService } from '../tools/tools.service';
import { run } from '@openai/agents';

jest.mock('@openai/agents', () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  run: jest.fn(),
  tool: jest.fn((config) => config),
}));

describe('ITAgentService', () => {
  let service: ITAgentService;
  let toolsService: jest.Mocked<ToolsService>;

  const mockTools = {
    raiseTicket: {
      function: {
        name: 'raise_ticket',
        description: 'Raise IT ticket',
        parameters: {},
      },
      execute: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ITAgentService,
        {
          provide: ToolsService,
          useValue: {
            getTools: jest.fn().mockReturnValue(mockTools),
          },
        },
      ],
    }).compile();

    service = module.get<ITAgentService>(ITAgentService);
    toolsService = module.get(ToolsService) as jest.Mocked<ToolsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize IT agent', () => {
    expect(service.itAgent).toBeDefined();
  });

  describe('handleTransfer', () => {
    it('should handle password reset request', async () => {
      const mockOutput =
        'To reset your password, go to the login page and click "Forgot Password"';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.handleTransfer(
        'I forgot my password, how do I reset it?',
      );

      expect(result).toBe(`[IT Support Agent]\n${mockOutput}`);
      expect(run).toHaveBeenCalledWith(
        service.itAgent,
        'I forgot my password, how do I reset it?',
      );
    });

    it('should handle laptop troubleshooting', async () => {
      const mockOutput =
        'Try restarting your laptop first. If the issue persists, check if all cables are properly connected.';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.handleTransfer(
        'My laptop is not turning on',
      );

      expect(result).toBe(`[IT Support Agent]\n${mockOutput}`);
    });

    it('should handle network connectivity issues', async () => {
      const mockOutput =
        'Check if your WiFi is enabled. Try disconnecting and reconnecting to the network.';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.handleTransfer(
        'I cannot connect to the office VPN',
      );

      expect(result).toBe(`[IT Support Agent]\n${mockOutput}`);
    });

    it('should handle software installation requests', async () => {
      const mockOutput =
        'I can help you with software installation. Please specify which software you need.';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.handleTransfer(
        'How do I install Microsoft Office?',
      );

      expect(result).toBe(`[IT Support Agent]\n${mockOutput}`);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Agent processing error';
      (run as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const result = await service.handleTransfer('test query');

      expect(result).toBe('Error Encountered: IT Agent');
    });

    it('should handle empty finalOutput', async () => {
      (run as jest.Mock).mockResolvedValue({
        finalOutput: '',
      });

      const result = await service.handleTransfer('test');

      expect(result).toBe('[IT Support Agent]\n');
    });

    it('should handle undefined finalOutput', async () => {
      (run as jest.Mock).mockResolvedValue({});

      const result = await service.handleTransfer('test');

      expect(result).toBe('[IT Support Agent]\n');
    });
  });
});
