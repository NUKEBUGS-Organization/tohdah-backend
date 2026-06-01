import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TohdahGateway } from './tohdah.gateway';
import type { AuthenticatedSocket } from './socket-auth.middleware';

describe('TohdahGateway', () => {
  let gateway: TohdahGateway;
  let mockServer: {
    to: jest.Mock;
    emit: jest.Mock;
    use: jest.Mock;
  };
  let chainTo: { emit: jest.Mock };

  const jwtService = {} as JwtService;
  const config = { get: jest.fn() } as unknown as ConfigService;

  function createSocket(overrides: Partial<AuthenticatedSocket> = {}) {
    const join = jest.fn();
    const leave = jest.fn();
    const disconnect = jest.fn();
    const to = jest.fn().mockReturnValue({ emit: jest.fn() });

    return {
      id: 'socket-1',
      userId: 'user-a',
      email: 'a@test.com',
      join,
      leave,
      disconnect,
      to,
      ...overrides,
    } as unknown as AuthenticatedSocket;
  }

  beforeEach(() => {
    chainTo = { emit: jest.fn() };
    mockServer = {
      to: jest.fn().mockReturnValue(chainTo),
      emit: jest.fn(),
      use: jest.fn(),
    };

    gateway = new TohdahGateway(jwtService, config);
    gateway.server = mockServer as never;
  });

  it('afterInit registers auth middleware', () => {
    gateway.afterInit(mockServer as never);
    expect(mockServer.use).toHaveBeenCalled();
  });

  it('handleConnection adds userId to userSockets map', () => {
    const socket = createSocket();
    gateway.handleConnection(socket);
    expect(gateway.isUserOnline('user-a')).toBe(true);
  });

  it('handleConnection joins user room', () => {
    const socket = createSocket();
    gateway.handleConnection(socket);
    expect(socket.join).toHaveBeenCalledWith('user:user-a');
  });

  it('handleDisconnect removes socket from userSockets map', () => {
    const socket = createSocket({ id: 'socket-1' });
    gateway.handleConnection(socket);
    gateway.handleDisconnect(socket);
    expect(gateway.isUserOnline('user-a')).toBe(false);
  });

  it('handleDisconnect removes userId entry when last socket disconnects', () => {
    const socket = createSocket();
    gateway.handleConnection(socket);
    gateway.handleDisconnect(socket);
    expect(gateway.getConnectedUserCount()).toBe(0);
  });

  it('handleJoinChat joins chat room', () => {
    const socket = createSocket();
    const res = gateway.handleJoinChat(socket, { bookingId: 'booking-1' });
    expect(socket.join).toHaveBeenCalledWith('chat:booking-1');
    expect(res).toEqual({ event: 'chat:joined', bookingId: 'booking-1' });
  });

  it('emitNewMessage calls server.to(chat:bookingId).emit', () => {
    const message = { _id: 'msg-1', content: 'hi' };
    gateway.emitNewMessage('booking-1', message);
    expect(mockServer.to).toHaveBeenCalledWith('chat:booking-1');
    expect(chainTo.emit).toHaveBeenCalledWith('chat:message', message);
  });

  it('emitNotification calls server.to(user:userId).emit', () => {
    const notification = { _id: 'n-1', title: 'Hello' };
    gateway.emitNotification('user-a', notification);
    expect(mockServer.to).toHaveBeenCalledWith('user:user-a');
    expect(chainTo.emit).toHaveBeenCalledWith('notification:new', notification);
  });

  it('emitBookingUpdate emits to both user rooms', () => {
    const booking = { _id: 'b-1', status: 'paid' };
    gateway.emitBookingUpdate('req-1', 'trav-1', booking);
    expect(mockServer.to).toHaveBeenCalledWith('user:req-1');
    expect(mockServer.to).toHaveBeenCalledWith('user:trav-1');
    expect(chainTo.emit).toHaveBeenCalledWith('booking:updated', booking);
    expect(chainTo.emit).toHaveBeenCalledTimes(2);
  });

  it('isUserOnline returns true when user has sockets', () => {
    const socket = createSocket();
    gateway.handleConnection(socket);
    expect(gateway.isUserOnline('user-a')).toBe(true);
    expect(gateway.isUserOnline('other')).toBe(false);
  });
});
