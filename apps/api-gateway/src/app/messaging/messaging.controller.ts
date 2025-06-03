import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  createConversation(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    return this.messagingService.createConversation(createConversationDto, req.user.id);
  }

  @Get('conversations')
  getConversations(@Request() req) {
    return this.messagingService.getConversations(req.user.id);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @Request() req) {
    return this.messagingService.getConversation(id, req.user.id);
  }

  @Post('messages')
  createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagingService.createMessage(createMessageDto, req.user.id);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Request() req,
  ) {
    return this.messagingService.getMessages(id, req.user.id, parseInt(page), parseInt(limit));
  }

  @Post('conversations/:id/read')
  markMessagesAsRead(@Param('id') id: string, @Request() req) {
    return this.messagingService.markMessagesAsRead(id, req.user.id);
  }

  @Get('unread-count')
  getUnreadMessageCount(@Request() req) {
    return this.messagingService.getUnreadMessageCount(req.user.id);
  }
}
