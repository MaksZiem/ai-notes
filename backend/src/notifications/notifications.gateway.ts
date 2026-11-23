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
import { readSessionToken } from 'src/users/session-cookie';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => callback(null, !origin || origin === process.env.FRONTEND_URL),
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const origin = client.handshake.headers.origin;
      if (origin && origin !== process.env.FRONTEND_URL) {
        throw new Error('Niedozwolony origin');
      }
      const token = readSessionToken(client.handshake.headers.cookie);
      if (!token) throw new Error('Brak cookie sesji');

      const payload = await this.jwtService.verifyAsync<{ id: string }>(token);
      const user = await this.usersService.findOne(payload.id);
      if (!user) throw new Error('Nieprawidłowy użytkownik');

      (client.data as { userId?: string }).userId = user.id;
      await client.join(`user:${user.id}`);
    } catch (error) {
      this.logger.warn(`Odrzucono połączenie WS: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect() {}

  notifyUser(userId: string) {
    this.server.to(`user:${userId}`).emit('notifications:changed');
  }
}
