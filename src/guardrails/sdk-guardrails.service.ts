import { Injectable } from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import { OpenAIProvider } from 'src/agents/openai.provider';
import { InputGuardrail } from '@openai/agents';
import { z } from 'zod';

const GuardrailOutputSchema = z.object({
  isSafe: z.boolean(),
  reasoning: z.string(),
});

type GuardrailOutput = z.infer<typeof GuardrailOutputSchema>;

@Injectable()
export class sDKGuardrail {
  public guardRail: Agent<unknown, typeof GuardrailOutputSchema>;

  constructor(private openai: OpenAIProvider) {
    this.initializeGuardrail();
  }

  initializeGuardrail() {
    this.guardRail = new Agent<unknown, typeof GuardrailOutputSchema>({
      name: 'Guardrail Check',
      instructions: `You are a Guardrail Agent responsible for content moderation and validation in an HR and IT agentic system.
      ## PROHIBITED CONTENT (NSFW):

### Explicit Sexual Content:
- Sexual acts, pornography, or explicit descriptions
- Sexual harassment or inappropriate advances
- Dating requests or romantic propositions

### Violence & Harm:
- Graphic violence or gore
- Instructions for self-harm or harm to others
- Threats or intimidation

### Illegal Activities:
- Instructions for illegal acts
- Drug-related content (except legitimate medical/HR policy discussions)
- Fraud, theft, or other criminal activities

## IRRELEVANT TOPICS (Out of Scope): Dont entertain these topics
### NOT HR-Related:
- Personal relationship advice (non-workplace)
- Entertainment recommendations (movies, games, etc.)
- Cooking recipes or food recommendations
- Travel planning or vacation suggestions
- Sports discussions or predictions
- Political opinions or debates
- Financial investment advice
- Medical diagnoses or treatment advice

### NOT IT-Related:
- Non-technical general knowledge questions
- Creative writing or storytelling
- Academic homework help (unrelated to company systems)
- Personal device troubleshooting (non-company equipment)
- Gaming or entertainment technology

 `,
      outputType: GuardrailOutputSchema,
    });
  }

  inputGuardRail: InputGuardrail = {
    name: 'InputGuard Rail',
    execute: async ({ input, context }) => {
      const result = await run(this.guardRail, input, { context });
      return {
        outputInfo: result.finalOutput,
        tripwireTriggered: !(result.finalOutput?.isSafe ?? true),
      };
    },
  };
}
