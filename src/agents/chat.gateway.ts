import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrchestratorService } from './orchestrator-agent.service';
import { InputGuardrailTripwireTriggered } from '@openai/agents';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly orchestratorService: OrchestratorService) {}

  handleConnection(client: Socket) {
    console.log(`Conneted:${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Disconnected:${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Message recieved from ${client.id}`);
      client.emit(`Status`, `Processing your request...`);
      const response = await this.orchestratorService.processOrcMessage(
        data.message,
      );
      const imagePathMatch = response.match(
        /generated_images[\/\\][\w-]+\.png/,
      );
      const imageUrl = imagePathMatch ? `/${imagePathMatch[0]}` : undefined;
      let agent: string | undefined;
      if (response.includes('[HR Agent]')) {
        agent = 'HR Assistant';
      } else if (response.includes('[IT Agent]')) {
        agent = 'IT Assistant';
      } else if (response.includes('[Image Generator]') || imageUrl) {
        agent = 'Image-Generator';
      }
      client.emit('receive_message', {
        content: response.replace(
          /\[(HR Agent|IT Agent|Image Generator)\]\n?/g,
          '',
        ),
        agent,
        imageUrl,
      });
      console.log(`Response sent to ${client.id}`);
    } catch (error) {
      console.error(`Error processing image:${error}`);
      if (error instanceof InputGuardrailTripwireTriggered) {
        const guardRailInfo = error.result.output.outputInfo;
        client.emit('guardrail_blocked', {
          message: 'Im sorry, I cant help with that',
          reasoning: guardRailInfo.reasoning,
        });
      } else {
        client.emit('error', {
          message: error.message || 'An error occurred',
        });
      }
    }
  }
}
