import { WebSocketGateway, WebSocketServer, type OnGatewayConnection } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';
import type { OrderView } from './order.view';

@WebSocketGateway({
  namespace: 'oficina',
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3001' },
})
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Namespace;

  constructor(private readonly tokens: TokenService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (typeof token !== 'string') {
      client.disconnect();
      return;
    }
    try {
      this.tokens.verifyAccess(token);
      void client.join('board');
    } catch {
      client.disconnect();
    }
  }

  emitUpdated(order: OrderView) {
    this.server?.to('board').emit('order.updated', order);
  }
}
