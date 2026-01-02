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
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Message from ${client.id}: ${data.message}`);

      await this.orchestratorService.processOrcMessageStream(
        data.message,
        (chunk: string) => {
          client.emit('message_chunk', { chunk });
        },
        (agent: string) => {
          client.emit('agent_detected', { agent });
        },
      );

      client.emit('stream_complete');
      console.log(`Stream complete for ${client.id}`);
    } catch (error) {
      console.error(`Error processing message:`, error);

      if (error instanceof InputGuardrailTripwireTriggered) {
        const guardRailInfo = error.result.output.outputInfo;
        client.emit('guardrail_blocked', {
          message: "I'm sorry, I can't help with that.",
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
