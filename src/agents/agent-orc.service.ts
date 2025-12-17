import { Injectable } from '@nestjs/common';
import * as readline from 'readline';
//import { GuardrailsService } from 'src/guardrails/guardrails.service';
import { OrchestratorService } from './orchestrator-agent.service';
import { InputGuardrailTripwireTriggered } from '@openai/agents';

@Injectable()
export class AgentOrchestrtor {
  private rl: readline.Interface;

  constructor(
    // private guardRails: GuardrailsService,
    private orchestratorAgent: OrchestratorService,
  ) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  startConversation() {
    this.promptUser();
  }

  private promptUser() {
    this.rl.question('You: ', (input: string) => {
      void this.handleUserInput(input);
    });
  }

  private async handleUserInput(input: string) {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n Exiting!');
      this.rl.close();
      return;
    }

    try {
      //guardrail check
      // const inputCheck = await this.guardRails.checkInput(input);
      // if (!inputCheck.passed) {
      //   console.log(`\nAssistant: ${inputCheck.message}\n`);
      //   this.promptUser();
      //   return;
      // }

      const response = await this.orchestratorAgent.processOrcMessage(input);
      console.log(`\n assistant: ${response}\n`);

      // const outputCheck = await this.guardRails.checkOutput(response || '');
      // if (!outputCheck.passed) {
      //   console.log(`\nassistant: ${outputCheck.message}\n`);
      // } else {
      //   console.log(`\nassistant: ${response}\n`);
      // }
    } catch (error) {
      if (error instanceof InputGuardrailTripwireTriggered) {
        const guardRailInfo = error.result.output.outputInfo;
        return {
          success: false,
          message: 'Im sorry cant help you with that',
          details: guardRailInfo.reasoning,
          type: `Blocked Guardrail`,
        };
      }
    }
    this.promptUser();
  }
}
