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
import { MessagingService } from './messaging.service';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private connectedClients = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Handle new connection
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.error('No token provided');
        client.disconnect();
        return;
      }

      // Verify token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store the connection
      this.connectedClients.set(client.id, userId);
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Join rooms for each conversation the user is part of
      const conversations = await this.messagingService.getConversations(userId);
      conversations.forEach(conversation => {
        client.join(`conversation:${conversation.id}`);
      });

      // Join user-specific room for direct notifications
      client.join(`user:${userId}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(client: Socket) {
    const userId = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} ${userId ? `(User: ${userId})` : ''}`);
  }

  /**
   * Handle message creation
   */
  @SubscribeMessage('createMessage')
  async handleCreateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      const userId = this.connectedClients.get(client.id);
      if (!userId) {
        return { error: 'Not authenticated' };
      }

      const message = await this.messagingService.createMessage(createMessageDto, userId);

      // Broadcast message to all clients in the conversation room
      this.server.to(`conversation:${createMessageDto.conversationId}`).emit('newMessage', message);

      // Get conversation details to notify other participants
      const conversation = await this.messagingService.getConversation(
        createMessageDto.conversationId,
        userId,
      );

      // Notify other participants
      conversation.participants
        .filter(p => p.id !== userId)
        .forEach(participant => {
          this.server.to(`user:${participant.id}`).emit('notification', {
            type: 'newMessage',
            conversationId: createMessageDto.conversationId,
            message,
          });
        });

      return message;
    } catch (error) {
      this.logger.error(`Error creating message: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Handle message read status update
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const userId = this.connectedClients.get(client.id);
      if (!userId) {
        return { error: 'Not authenticated' };
      }

      const result = await this.messagingService.markMessagesAsRead(data.conversationId, userId);
      
      // Broadcast read status to all clients in the conversation room
      this.server.to(`conversation:${data.conversationId}`).emit('messagesRead', {
        conversationId: data.conversationId,
        userId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Handle client typing indication
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string, isTyping: boolean },
  ) {
    const userId = this.connectedClients.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    // Broadcast typing status to all clients in the conversation room except sender
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  /**
   * Join a conversation room
   */
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const userId = this.connectedClients.get(client.id);
      if (!userId) {
        return { error: 'Not authenticated' };
      }

      // Verify the user is a participant in the conversation
      await this.messagingService.getConversation(data.conversationId, userId);

      // Join the room
      client.join(`conversation:${data.conversationId}`);
      this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error joining conversation: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Leave a conversation room
   */
  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = this.connectedClients.get(client.id);
    if (!userId) {
      return { error: 'Not authenticated' };
    }

    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(`User ${userId} left conversation ${data.conversationId}`);

    return { success: true };
  }
}
