import { Test, TestingModule } from '@nestjs/testing';
import { OrchestratorService } from './orchestrator-agent.service';
import { HRAgentService } from './hr-agent.service';
import { ITAgentService } from './it-agent.service';
import { ImageGenService } from './image-gen.service';
import { sDKGuardrail } from '../guardrails/sdk-guardrails.service';
import { run } from '@openai/agents';

jest.mock('@openai/agents', () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  run: jest.fn(),
  handoff: jest.fn((agent) => agent),
}));

describe('OrchestratorService', () => {
  let service: OrchestratorService;
  let hrAgent: jest.Mocked<HRAgentService>;
  let itAgent: jest.Mocked<ITAgentService>;
  let imgGenService: jest.Mocked<ImageGenService>;
  let guardrailService: jest.Mocked<sDKGuardrail>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestratorService,
        {
          provide: HRAgentService,
          useValue: {
            hrAgent: {},
          },
        },
        {
          provide: ITAgentService,
          useValue: {
            itAgent: {},
          },
        },
        {
          provide: ImageGenService,
          useValue: {
            imageAgent: {},
          },
        },
        {
          provide: sDKGuardrail,
          useValue: {
            inputGuardRail: {},
          },
        },
      ],
    }).compile();

    service = module.get<OrchestratorService>(OrchestratorService);
    hrAgent = module.get(HRAgentService) as jest.Mocked<HRAgentService>;
    itAgent = module.get(ITAgentService) as jest.Mocked<ITAgentService>;
    imgGenService = module.get(ImageGenService) as jest.Mocked<ImageGenService>;
    guardrailService = module.get(sDKGuardrail) as jest.Mocked<sDKGuardrail>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processOrcMessage', () => {
    it('should route HR-related queries to HR agent', async () => {
      const mockOutput = 'You have 15 vacation days available';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'How many vacation days do I have?',
      );

      expect(result).toBe(mockOutput);
    });

    it('should route IT-related queries to IT agent', async () => {
      const mockOutput = 'Try restarting your laptop';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'My laptop is not working',
      );

      expect(result).toBe(mockOutput);
    });

    it('should route image generation requests to image generator', async () => {
      const mockOutput = 'Image generated successfully';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'Generate an image of a sunset',
      );

      expect(result).toBe(mockOutput);
    });

    it('should handle greeting messages', async () => {
      const mockOutput = 'Hello! How can I help you today?';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage('Hello');

      expect(result).toBe(mockOutput);
    });

    it('should handle leave request queries', async () => {
      const mockOutput = 'Leave request submitted successfully';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'I want to request leave from Jan 15 to Jan 20',
      );

      expect(result).toBe(mockOutput);
    });

    it('should handle password reset queries', async () => {
      const mockOutput = 'Password reset instructions sent';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage('I forgot my password');

      expect(result).toBe(mockOutput);
    });

    it('should handle policy queries', async () => {
      const mockOutput = 'Here are the company policies';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'What is the company policy on remote work?',
      );

      expect(result).toBe(mockOutput);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Orchestrator error';
      (run as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.processOrcMessage('test message');

      expect(result).toBe('Errro');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty finalOutput', async () => {
      (run as jest.Mock).mockResolvedValue({
        finalOutput: '',
      });

      const result = await service.processOrcMessage('test');

      expect(result).toBe('');
    });

    it('should handle undefined finalOutput', async () => {
      (run as jest.Mock).mockResolvedValue({});

      const result = await service.processOrcMessage('test');

      expect(result).toBe('');
    });

    it('should route software installation queries to IT', async () => {
      const mockOutput = 'Software installation guide provided';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'How do I install Microsoft Teams?',
      );

      expect(result).toBe(mockOutput);
    });

    it('should route network issues to IT', async () => {
      const mockOutput = 'VPN troubleshooting steps provided';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage('Cannot connect to VPN');

      expect(result).toBe(mockOutput);
    });

    it('should route benefits questions to HR', async () => {
      const mockOutput = 'Benefits information provided';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'What are the health insurance benefits?',
      );

      expect(result).toBe(mockOutput);
    });

    it('should handle complex image generation requests', async () => {
      const mockOutput = 'Image generated with specified parameters';
      (run as jest.Mock).mockResolvedValue({
        finalOutput: mockOutput,
      });

      const result = await service.processOrcMessage(
        'Create a picture of a futuristic city at night',
      );

      expect(result).toBe(mockOutput);
    });
  });
});
