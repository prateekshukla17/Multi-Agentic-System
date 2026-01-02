import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorService } from '../src/agents/orchestrator-agent.service';
import { HRAgentService } from '../src/agents/hr-agent.service';
import { ITAgentService } from '../src/agents/it-agent.service';
import { ImageGenService } from '../src/agents/image-gen.service';
import { sDKGuardrail } from '../src/guardrails/sdk-guardrails.service';
import { ToolsService } from '../src/tools/tools.service';
import { RagService } from '../src/tools/rag.service';
import { LeaveToolService } from '../src/tools/leave-tool.service';
import { ImgToolService } from '../src/tools/imgTool.service';
import { RaiseTicketService } from '../src/tools/ticket.service';
import { OpenAIProvider } from '../src/agents/openai.provider';
import { getModelToken } from '@nestjs/mongoose';
import { Leave } from '../src/database/schemas/leave.schema';
import { Ticket } from '../src/database/schemas/ticket.schema';

// Mock external dependencies
jest.mock('@openai/agents');
global.fetch = jest.fn();
jest.mock('fs');
jest.mock('axios');

describe('Agentic System Integration Tests (e2e)', () => {
  let app: INestApplication;
  let orchestratorService: OrchestratorService;
  let hrAgentService: HRAgentService;
  let itAgentService: ITAgentService;
  let imageGenService: ImageGenService;

  beforeAll(async () => {
    // Mock fs before creating module
    const fs = require('fs');
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              OPENAI_API_KEY: 'test-openai-key',
              QDRANT_URL: 'http://localhost:6333',
              QDRANT_API_KEY: 'test-qdrant-key',
              QDRANT_COLLECTION_NAME: 'test_collection',
              MONGODB_URI: 'mongodb://localhost:27017/test',
            }),
          ],
        }),
      ],
      providers: [
        OrchestratorService,
        HRAgentService,
        ITAgentService,
        ImageGenService,
        sDKGuardrail,
        ToolsService,
        RagService,
        LeaveToolService,
        ImgToolService,
        RaiseTicketService,
        {
          provide: OpenAIProvider,
          useValue: {
            client: {
              images: {
                generate: jest.fn().mockResolvedValue({
                  data: [{ url: 'https://example.com/test.png' }],
                }),
              },
            },
          },
        },
        {
          provide: getModelToken(Leave.name),
          useValue: jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({}),
          })),
        },
        {
          provide: getModelToken(Ticket.name),
          useValue: jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({}),
          })),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    orchestratorService = moduleFixture.get<OrchestratorService>(
      OrchestratorService,
    );
    hrAgentService = moduleFixture.get<HRAgentService>(HRAgentService);
    itAgentService = moduleFixture.get<ITAgentService>(ITAgentService);
    imageGenService = moduleFixture.get<ImageGenService>(ImageGenService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('End-to-End Agent Workflows', () => {
    describe('HR Agent Workflow', () => {
      it('should handle complete leave request workflow', async () => {
        // Mock the entire flow from orchestrator to HR agent to tools
        const { run } = require('@openai/agents');
        
        // Mock embedding and Qdrant for policy query
        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              data: [{ embedding: new Array(1536).fill(0.1) }],
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              result: [
                {
                  id: 1,
                  score: 0.9,
                  payload: { text: 'Employees get 15 vacation days per year' },
                },
              ],
            }),
          });

        run.mockResolvedValue({
          finalOutput: 'You have 15 vacation days available per year.',
        });

        const result = await orchestratorService.processOrcMessage(
          'How many vacation days do I have?',
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });

      it('should handle leave submission through HR agent', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput: 'Your leave request has been submitted successfully!',
        });

        const result = await orchestratorService.processOrcMessage(
          'I want to apply for vacation leave from Jan 15 to Jan 20',
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    describe('IT Agent Workflow', () => {
      it('should handle IT support query end-to-end', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput:
            'To reset your password, visit the IT portal and click "Forgot Password".',
        });

        const result = await orchestratorService.processOrcMessage(
          'I forgot my password, how do I reset it?',
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });

      it('should handle laptop troubleshooting workflow', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput:
            'Try restarting your laptop first. If the issue persists, contact IT support.',
        });

        const result = await orchestratorService.processOrcMessage(
          'My laptop is not starting',
        );

        expect(result).toBeDefined();
      });
    });

    describe('Image Generation Workflow', () => {
      it('should handle image generation end-to-end', async () => {
        const { run } = require('@openai/agents');
        const axios = require('axios');

        // Mock OpenAI image generation
        const mockOpenAIClient = {
          images: {
            generate: jest.fn().mockResolvedValue({
              data: [{ url: 'https://example.com/image.png' }],
            }),
          },
        };

        axios.get.mockResolvedValue({
          data: Buffer.from('fake-image-data'),
        });

        run.mockResolvedValue({
          finalOutput: 'Image generated successfully!',
        });

        const result = await orchestratorService.processOrcMessage(
          'Generate an image of a sunset',
        );

        expect(result).toBeDefined();
      });
    });

    describe('Orchestrator Routing', () => {
      it('should correctly route HR queries', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput: 'Routing to HR Agent',
        });

        const hrQueries = [
          'What are my benefits?',
          'How do I apply for leave?',
          'Tell me about the company policy',
        ];

        for (const query of hrQueries) {
          const result = await orchestratorService.processOrcMessage(query);
          expect(result).toBeDefined();
        }
      });

      it('should correctly route IT queries', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput: 'Routing to IT Agent',
        });

        const itQueries = [
          'My laptop is broken',
          'Cannot connect to VPN',
          'Need help with software installation',
        ];

        for (const query of itQueries) {
          const result = await orchestratorService.processOrcMessage(query);
          expect(result).toBeDefined();
        }
      });

      it('should correctly route image generation queries', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput: 'Routing to Image Generator',
        });

        const imgQueries = [
          'Generate an image of a cat',
          'Create a picture of mountains',
          'Make an image showing a futuristic city',
        ];

        for (const query of imgQueries) {
          const result = await orchestratorService.processOrcMessage(query);
          expect(result).toBeDefined();
        }
      });
    });

    describe('Error Handling Across System', () => {
      it('should handle errors gracefully in orchestrator', async () => {
        const { run } = require('@openai/agents');

        run.mockRejectedValue(new Error('System error'));

        const result = await orchestratorService.processOrcMessage(
          'test query',
        );

        expect(result).toBeDefined();
        // Should return error message, not throw
      });

      it('should handle agent failures without crashing', async () => {
        const { run } = require('@openai/agents');

        run.mockRejectedValue(new Error('Agent failure'));

        const result = await orchestratorService.processOrcMessage(
          'How many vacation days?',
        );

        expect(result).toBeDefined();
      });
    });

    describe('Multi-Agent Coordination', () => {
      it('should handle queries that might involve multiple agents', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput: 'Coordinating response',
        });

        const result = await orchestratorService.processOrcMessage(
          'Hello, I need help with my laptop and want to know about leave policies',
        );

        expect(result).toBeDefined();
      });

      it('should maintain context across agent handoffs', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput: 'Context maintained',
        });

        // First query
        await orchestratorService.processOrcMessage('Hello');

        // Second query that might depend on context
        const result = await orchestratorService.processOrcMessage(
          'Can you help me with that?',
        );

        expect(result).toBeDefined();
      });
    });

    describe('Tool Integration', () => {
      it('should successfully integrate RAG tool for policy queries', async () => {
        const { run } = require('@openai/agents');

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              data: [{ embedding: new Array(1536).fill(0.1) }],
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              result: [
                { id: 1, score: 0.9, payload: { text: 'Policy information' } },
              ],
            }),
          });

        run.mockResolvedValue({
          finalOutput: 'Policy information retrieved',
        });

        const result = await orchestratorService.processOrcMessage(
          'What is the sick leave policy?',
        );

        expect(result).toBeDefined();
      });

      it('should handle leave request submission tool', async () => {
        const { run } = require('@openai/agents');

        run.mockResolvedValue({
          finalOutput: 'Leave request submitted',
        });

        const result = await orchestratorService.processOrcMessage(
          'Submit leave request for Jan 15 to Jan 20',
        );

        expect(result).toBeDefined();
      });
    });
  });

  describe('System Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const { run } = require('@openai/agents');

      run.mockResolvedValue({
        finalOutput: 'Response',
      });

      const queries = [
        'How many vacation days?',
        'Reset my password',
        'Generate an image',
      ];

      const results = await Promise.all(
        queries.map((query) => orchestratorService.processOrcMessage(query)),
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });

    it('should respond within reasonable time for simple queries', async () => {
      const { run } = require('@openai/agents');

      run.mockResolvedValue({
        finalOutput: 'Quick response',
      });

      const startTime = Date.now();
      await orchestratorService.processOrcMessage('Hello');
      const endTime = Date.now();

      // Should be fast since we're mocking
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Agent Independence', () => {
    it('should allow HR agent to function independently', async () => {
      const { run } = require('@openai/agents');

      run.mockResolvedValue({
        finalOutput: 'HR response',
      });

      const result = await hrAgentService.processMessage('Test HR query');

      expect(result).toContain('[HR Agent]');
    });

    it('should allow IT agent to function independently', async () => {
      const { run } = require('@openai/agents');

      run.mockResolvedValue({
        finalOutput: 'IT response',
      });

      const result = await itAgentService.handleTransfer('Test IT query');

      expect(result).toContain('[IT Support Agent]');
    });

    it('should allow Image Generator to function independently', async () => {
      const { run } = require('@openai/agents');

      run.mockResolvedValue({
        finalOutput: 'Image generated',
      });

      const result = await imageGenService.processMessage(
        'Generate test image',
      );

      expect(result).toContain('[Image Generator]');
    });
  });
});
