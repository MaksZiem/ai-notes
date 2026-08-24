import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: 'http://localhost:5173', credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('Brak tokenu');

      const payload = await this.jwtService.verifyAsync<{ id: number }>(token);
      const user = await this.usersService.findOne(payload.id);
      if (!user) throw new Error('Nieprawidłowy użytkownik');

      client.data.userId = user.id;
      await client.join(`user:${user.id}`);
    } catch (error) {
      this.logger.warn(`Odrzucono połączenie WS: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect() {}

  notifyUser(userId: number) {
    this.server.to(`user:${userId}`).emit('notifications:changed');
  }
}
