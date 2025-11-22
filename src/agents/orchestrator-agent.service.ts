import { Injectable } from '@nestjs/common';
import { Agent, run, handoff } from '@openai/agents';
import { ITAgentService } from './it-agent.service';
import { HRAgentService } from './hr-agent.service';
import { sDKGuardrail } from 'src/guardrails/sdk-guardrails.service';
@Injectable()
export class OrchestratorService {
  private orchAgent: Agent;
  constructor(
    private hrAgent: HRAgentService,
    private itAgent: ITAgentService,
    private inputGuard: sDKGuardrail,
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

BEHAVIOR:
- Analyze the user's message and immediately hand off to the correct specialist
- For greetings or unclear requests, default to HR Agent
- Do NOT answer questions yourself - always route to a specialist`,
      handoffs: [this.hrAgent.hrAgent, this.itAgent.itAgent],
      inputGuardrails: [this.inputGuard.inputGuardRail],
    });
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
