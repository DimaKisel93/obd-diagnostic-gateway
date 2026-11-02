import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

interface TelemetryDataEvent {
  readings: {
    pid: string;
    name: string;
    value: number | null;
    unit: string;
    timestamp: number;
  }[];
  sessionId: string;
  timestamp: number;
}

interface SessionStatusEvent {
  sessionId: string | null;
  status: 'started' | 'ended';
  adapter: string;
  timestamp: number;
}

@WebSocketGateway({
  namespace: '/telemetry',
  cors: {
    origin: '*',
  },
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private connectedClients = new Map<string, Set<string>>();

  constructor(private readonly telemetryService: TelemetryService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe:session')
  async handleSubscribeSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    if (!sessionId) {
      return { success: false, error: 'sessionId is required' };
    }

    await client.join(`session:${sessionId}`);

    if (!this.connectedClients.has(client.id)) {
      this.connectedClients.set(client.id, new Set());
    }
    this.connectedClients.get(client.id)!.add(sessionId);

    this.logger.log(`Client ${client.id} subscribed to session ${sessionId}`);

    const snapshot = await this.telemetryService.getSnapshot(sessionId);
    client.emit('telemetry:snapshot', {
      sessionId,
      readings: snapshot,
      timestamp: Date.now(),
    });

    return { success: true, sessionId };
  }

  @SubscribeMessage('unsubscribe:session')
  async handleUnsubscribeSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    if (!sessionId) {
      return { success: false, error: 'sessionId is required' };
    }

    await client.leave(`session:${sessionId}`);

    const clientSessions = this.connectedClients.get(client.id);
    if (clientSessions) {
      clientSessions.delete(sessionId);
    }

    this.logger.log(`Client ${client.id} unsubscribed from session ${sessionId}`);
    return { success: true, sessionId };
  }

  broadcastReadings(sessionId: string, readings: {
    pid: string;
    name: string;
    value: number | null;
    unit: string | null;
    recordedAt: Date;
  }[]) {
    const event: TelemetryDataEvent = {
      readings: readings.map((r) => ({
        pid: r.pid,
        name: r.name,
        value: r.value,
        unit: r.unit ?? '',
        timestamp: r.recordedAt.getTime(),
      })),
      sessionId,
      timestamp: Date.now(),
    };

    this.server.to(`session:${sessionId}`).emit('telemetry:data', event);
    this.logger.debug(`Broadcasted ${readings.length} readings to session ${sessionId}`);
  }

  broadcastSessionStatus(event: SessionStatusEvent) {
    this.server.emit('telemetry:session', event);
    this.logger.log(`Broadcasted session ${event.status}: ${event.sessionId}`);
  }

  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }

  getSessionSubscribers(sessionId: string): string[] {
    const subscribers: string[] = [];
    for (const [clientId, sessions] of this.connectedClients.entries()) {
      if (sessions.has(sessionId)) {
        subscribers.push(clientId);
      }
    }
    return subscribers;
  }
}