import { Injectable } from '@nestjs/common';
import { Agent, run, handoff, user } from '@openai/agents';
import { ITAgentService } from './it-agent.service';
import { HRAgentService } from './hr-agent.service';
import { sDKGuardrail } from 'src/guardrails/sdk-guardrails.service';
import { ImageGenService } from './image-gen.service';
type ChunkCallback = (chunk: string) => void;
type AgentCallback = (agent: string) => void;
@Injectable()
export class OrchestratorService {
  private orchAgent: Agent;
  constructor(
    private hrAgent: HRAgentService,
    private itAgent: ITAgentService,
    private inputGuard: sDKGuardrail,
    private imgGen: ImageGenService,
  ) {
    this.orchestratorAgent();
  }
  orchestratorAgent() {
    this.orchAgent = new Agent({
      name: 'Orchestrator',
      instructions: `You are a triage assistant that routes user queries to the appropriate department.

ROUTING RULES:
→ HR Agent: Warm Talk, professional small talk, policies, benefits, PTO/leave, payroll, onboarding, workplace issues, general work chat
→ IT Agent: passwords, software, hardware, network/VPN, system access, technical issues
→ Image Generator: image generation, creating pictures, making visuals, "generate image", "create picture", design requests

BEHAVIOR:
- Analyze the user's message and immediately hand off to the correct specialist
- For greetings or unclear requests, default to HR Agent
- Do NOT answer questions yourself - always route to a specialist`,
      handoffs: [
        this.hrAgent.hrAgent,
        this.itAgent.itAgent,
        this.imgGen.imageAgent,
      ],
      inputGuardrails: [this.inputGuard.inputGuardRail],
    });
  }
  async processOrcMessageStream(
    userMessage: string,
    chunkCallback?: ChunkCallback,
    agentCallback?: AgentCallback,
  ): Promise<void> {
    try {
      console.log('Orchestrator processing:', userMessage);

      const stream = await run(this.orchAgent, userMessage, {
        stream: true,
      });

      let detectedAgent: string | undefined;
      let fullText = '';

      for await (const event of stream as AsyncIterable<any>) {
        if (event.type === 'agent_updated_stream_event' && event.agent?.name) {
          detectedAgent = event.agent.name;
          if (detectedAgent !== undefined) {
            agentCallback?.(detectedAgent);
            console.log(`Agent: ${detectedAgent}`);
          }
        }

        if (event.type === 'raw_model_stream_event') {
          const delta = event.delta || event.snapshot;

          if (delta?.choices?.[0]?.delta?.content) {
            const textChunk = delta.choices[0].delta.content;
            chunkCallback?.(textChunk);
            fullText += textChunk;
          }
        }

        if (event.type === 'run_item_stream_event') {
          if (event.item?.content) {
            const content = event.item.content;
            if (typeof content === 'string') {
              chunkCallback?.(content);
              fullText += content;
            } else if (Array.isArray(content)) {
              await Promise.all(
                content.map(async (block) => {
                  if (block.type === 'text' && block.text) {
                    chunkCallback?.(block.text);
                    fullText += block.text;
                  }
                }),
              );
            }
          }

          if (
            event.item?.type === 'function_call_output' &&
            event.item.output
          ) {
            const output = JSON.parse(event.item.output);
            if (output.imagePath) {
              const imageUrl = `/${output.imagePath.replace(/\\/g, '/')}`;
              chunkCallback?.(`[IMAGE:${imageUrl}]`);
            }
          }
        }
      }

      await stream.completed;

      console.log('Stream completed');
      console.log('Total text streamed:', fullText.length, 'chars');
    } catch (error) {
      console.error(`Streaming error:`, error);
      throw error;
    }
  }

  async processOrcMessage(userMessage: string): Promise<string> {
    try {
      const result = await run(this.orchAgent, userMessage);
      const output = result.finalOutput || '';

      return output;
    } catch (error) {
      console.error(`Error in OrchAgent Request`, error);
      return `Errro`;
    }
  }
}
