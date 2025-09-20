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
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from '../../shared/config/jwt-config.service';
import { CallsService } from './calls.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@Injectable()
@WebSocketGateway({
  namespace: '/calls',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
    private readonly callsService: CallsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: this.jwtConfigService.secret,
      });

      if (payload && payload.sub) {
        client.userId = payload.sub;
        this.connectedUsers.set(payload.sub, client.id);

        console.log(
          `User ${payload.sub} connected to calls with socket ${client.id}`,
        );
        console.log('Total connected users:', this.connectedUsers.size);

        // Join user to their personal room
        client.join(`user_${payload.sub}`);
      } else {
        console.log('Invalid token, disconnecting client');
        client.disconnect();
      }
    } catch (error) {
      console.error('Calls WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      console.log(`User ${client.userId} disconnected from calls`);
    }
  }

  @SubscribeMessage('start_call')
  async handleStartCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { calleeId: number; callId: string; isVideo?: boolean; offer?: any },
  ) {
    if (!client.userId) return;

    console.log(`User ${client.userId} starting call to ${data.calleeId}`);
    console.log('Call data received:', data);
    console.log('Is video call:', data.isVideo);
    console.log('Connected users:', Array.from(this.connectedUsers.keys()));

    try {
      const callSession = await this.callsService.createCallSession({
        callerId: client.userId,
        calleeId: data.calleeId,
        callId: data.callId,
        type: data.isVideo ? 'VIDEO' : 'AUDIO',
        status: 'RINGING',
      });

      console.log('Call session created:', callSession);

      // Notify callee
      const calleeSocketId = this.connectedUsers.get(data.calleeId);
      console.log(`Callee socket ID: ${calleeSocketId}`);

      if (calleeSocketId) {
        const callData = {
          id: data.callId,
          caller: callSession.caller,
          callee: callSession.callee,
          type: 'incoming',
          status: 'ringing',
          isVideo: data.isVideo || false,
        };
        console.log('Sending call_received to callee:', callData);
        this.server.to(calleeSocketId).emit('call_received', callData);

        // Send offer to callee if provided
        if (data.offer) {
          this.server.to(calleeSocketId).emit('offer', {
            offer: data.offer,
            callId: data.callId,
          });
        }
      } else {
        console.log(`Callee ${data.calleeId} is not connected`);
      }

      // Confirm to caller
      client.emit('call_initiated', {
        callId: data.callId,
        status: 'ringing',
      });
    } catch (error) {
      console.error('Error starting call:', error);
      client.emit('call_error', { error: 'Failed to start call' });
    }
  }

  @SubscribeMessage('answer_call')
  async handleAnswerCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    if (!client.userId) return;

    try {
      await this.callsService.updateCallStatus(data.callId, 'ONGOING');

      // Notify caller
      const callSession = await this.callsService.getCallSession(data.callId);
      if (callSession) {
        const callerSocketId = this.connectedUsers.get(callSession.callerId);
        if (callerSocketId) {
          this.server.to(callerSocketId).emit('call_answered', {
            callId: data.callId,
          });
        }
      }
    } catch (error) {
      console.error('Error answering call:', error);
      client.emit('call_error', { error: 'Failed to answer call' });
    }
  }

  @SubscribeMessage('reject_call')
  async handleRejectCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    if (!client.userId) return;

    try {
      await this.callsService.updateCallStatus(data.callId, 'REJECTED');

      // Notify caller
      const callSession = await this.callsService.getCallSession(data.callId);
      if (callSession) {
        const callerSocketId = this.connectedUsers.get(callSession.callerId);
        if (callerSocketId) {
          this.server.to(callerSocketId).emit('call_rejected', {
            callId: data.callId,
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting call:', error);
      client.emit('call_error', { error: 'Failed to reject call' });
    }
  }

  @SubscribeMessage('end_call')
  async handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    if (!client.userId) return;

    try {
      await this.callsService.updateCallStatus(data.callId, 'ENDED');

      // Notify other participant
      const callSession = await this.callsService.getCallSession(data.callId);
      if (callSession) {
        const otherUserId =
          callSession.callerId === client.userId
            ? callSession.calleeId
            : callSession.callerId;

        const otherSocketId = this.connectedUsers.get(otherUserId);
        if (otherSocketId) {
          this.server.to(otherSocketId).emit('call_ended', {
            callId: data.callId,
          });
        }
      }
    } catch (error) {
      console.error('Error ending call:', error);
      client.emit('call_error', { error: 'Failed to end call' });
    }
  }

  @SubscribeMessage('answer')
  async handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; answer: any },
  ) {
    if (!client.userId) return;

    try {
      const callSession = await this.callsService.getCallSession(data.callId);
      if (callSession) {
        const otherUserId =
          callSession.callerId === client.userId
            ? callSession.calleeId
            : callSession.callerId;

        const otherSocketId = this.connectedUsers.get(otherUserId);
        if (otherSocketId) {
          this.server.to(otherSocketId).emit('answer', {
            answer: data.answer,
            callId: data.callId,
          });
        }
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  @SubscribeMessage('ice_candidate')
  async handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; candidate: any },
  ) {
    if (!client.userId) return;

    try {
      const callSession = await this.callsService.getCallSession(data.callId);
      if (callSession) {
        const otherUserId =
          callSession.callerId === client.userId
            ? callSession.calleeId
            : callSession.callerId;

        const otherSocketId = this.connectedUsers.get(otherUserId);
        if (otherSocketId) {
          this.server.to(otherSocketId).emit('ice_candidate', {
            candidate: data.candidate,
            callId: data.callId,
          });
        }
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }
}
