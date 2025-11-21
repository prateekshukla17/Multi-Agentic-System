import { Injectable } from '@nestjs/common';
import { Agent, run, handoff } from '@openai/agents';
import { ITAgentService } from './it-agent.service';
import { HRAgentService } from './hr-agent.service';

@Injectable()
export class OrchestratorService {
  private orchAgent: Agent;
  constructor(
    private hrAgent: HRAgentService,
    private itAgent: ITAgentService,
  ) {
    this.orchestratorAgent();
  }
  orchestratorAgent() {
    this.orchAgent = new Agent({
      name: 'Orchestrator',
      instructions: `You are a triage assistant that routes user queries to the appropriate department.

ROUTING RULES:
→ HR Agent: policies, benefits, PTO/leave, payroll, onboarding, workplace issues, general work chat
→ IT Agent: passwords, software, hardware, network/VPN, system access, technical issues

BEHAVIOR:
- Analyze the user's message and immediately hand off to the correct specialist
- For greetings or unclear requests, default to HR Agent
- Do NOT answer questions yourself - always route to a specialist`,
      handoffs: [handoff(this.hrAgent.hrAgent), handoff(this.itAgent.itAgent)],
    });
  }
}
