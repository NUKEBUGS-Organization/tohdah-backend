import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  type AuthenticatedSocket,
  createSocketAuthMiddleware,
} from './socket-auth.middleware';

@WebSocketGateway({
  cors: {
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class TohdahGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TohdahGateway.name);

  // userId → Set of socketIds (one user, multiple tabs)
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  afterInit(server: Server) {
    server.use(
      createSocketAuthMiddleware(this.jwtService, this.config) as (
        socket: AuthenticatedSocket,
        next: (err?: Error) => void,
      ) => void,
    );
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    socket.join(`user:${userId}`);

    this.logger.log(
      `Connected: ${userId} (socket ${socket.id}) — ` +
        `${this.userSockets.get(userId)!.size} session(s)`,
    );
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`Disconnected: ${userId} (socket ${socket.id})`);
  }

  @SubscribeMessage('chat:join')
  handleJoinChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    const authSocket = socket as AuthenticatedSocket;
    socket.join(`chat:${data.bookingId}`);
    this.logger.log(`${authSocket.userId} joined chat room: ${data.bookingId}`);
    return { event: 'chat:joined', bookingId: data.bookingId };
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    socket.leave(`chat:${data.bookingId}`);
    return { event: 'chat:left', bookingId: data.bookingId };
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    const authSocket = socket as AuthenticatedSocket;
    socket.to(`chat:${data.bookingId}`).emit('chat:typing', {
      userId: authSocket.userId,
      bookingId: data.bookingId,
    });
  }

  @SubscribeMessage('chat:stop_typing')
  handleStopTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    const authSocket = socket as AuthenticatedSocket;
    socket.to(`chat:${data.bookingId}`).emit('chat:stop_typing', {
      userId: authSocket.userId,
      bookingId: data.bookingId,
    });
  }

  emitNewMessage(bookingId: string, message: unknown) {
    this.server.to(`chat:${bookingId}`).emit('chat:message', message);
  }

  emitNotification(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  emitBookingUpdate(
    requesterId: string,
    travelerId: string,
    booking: unknown,
  ) {
    this.server.to(`user:${requesterId}`).emit('booking:updated', booking);
    this.server.to(`user:${travelerId}`).emit('booking:updated', booking);
  }

  isUserOnline(userId: string): boolean {
    return (
      this.userSockets.has(userId) &&
      (this.userSockets.get(userId)?.size ?? 0) > 0
    );
  }

  getConnectedUserCount(): number {
    return this.userSockets.size;
  }
}
