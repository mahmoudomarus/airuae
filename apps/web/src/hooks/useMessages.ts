'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import { Message } from './useConversations';

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface MessagesResponse {
  messages: Message[];
  pagination: Pagination;
}

interface UseMessagesProps {
  conversationId: string;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<Message>;
  markAsRead: () => Promise<void>;
  loadMoreMessages: () => Promise<boolean>;
  hasMoreMessages: boolean;
  isTyping: { [userId: string]: boolean };
  setUserTyping: (isTyping: boolean) => void;
}

export function useMessages({ conversationId }: UseMessagesProps): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const { socket, isConnected } = useSocket();

  // Fetch messages
  const fetchMessages = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const response = await api.get<MessagesResponse>(
          `/messaging/conversations/${conversationId}/messages?page=${page}&limit=20`
        );

        if (page === 1) {
          setMessages(response.messages);
        } else {
          setMessages(prev => [...prev, ...response.messages]);
        }

        setPagination(response.pagination);
        
        // Mark messages as read when fetched
        if (response.messages.length > 0) {
          await api.post(`/messaging/conversations/${conversationId}/read`);
          
          // Emit read status via socket
          if (socket && isConnected) {
            socket.emit('markAsRead', { conversationId });
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    },
    [conversationId, socket, isConnected]
  );

  // Initial fetch
  useEffect(() => {
    if (conversationId) {
      fetchMessages(1);
      
      // Join the conversation room
      if (socket && isConnected) {
        socket.emit('joinConversation', { conversationId });
      }
    }
    
    return () => {
      // Leave the conversation room
      if (socket && isConnected) {
        socket.emit('leaveConversation', { conversationId });
      }
    };
  }, [conversationId, fetchMessages, socket, isConnected]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    // Handle new message
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [message, ...prev]);
        
        // Mark as read immediately if we're in the conversation
        socket.emit('markAsRead', { conversationId });
      }
    };

    // Handle typing status
    const handleUserTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId) {
        setIsTyping(prev => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));

        // Clear typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setIsTyping(prev => ({
              ...prev,
              [data.userId]: false,
            }));
          }, 3000);
        }
      }
    };

    // Listen for socket events
    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);

    // Clean up
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
    };
  }, [socket, isConnected, conversationId]);

  // Send a message
  const sendMessage = async (content: string): Promise<Message> => {
    try {
      // Send via API
      const message = await api.post<Message>('/messaging/messages', {
        conversationId,
        content,
      });

      // Also emit via socket for real-time
      if (socket && isConnected) {
        socket.emit('createMessage', {
          conversationId,
          content,
        });
      }

      return message;
    } catch (err) {
      console.error('Error sending message:', err);
      throw new Error('Failed to send message');
    }
  };

  // Mark messages as read
  const markAsRead = async (): Promise<void> => {
    try {
      await api.post(`/messaging/conversations/${conversationId}/read`);
      
      // Emit read status via socket
      if (socket && isConnected) {
        socket.emit('markAsRead', { conversationId });
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
      throw new Error('Failed to mark messages as read');
    }
  };

  // Load more messages
  const loadMoreMessages = async (): Promise<boolean> => {
    if (pagination.page >= pagination.totalPages) {
      return false;
    }

    const nextPage = pagination.page + 1;
    await fetchMessages(nextPage);
    return true;
  };

  // Set user typing status
  const setUserTyping = (isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId, isTyping });
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    loadMoreMessages,
    hasMoreMessages: pagination.page < pagination.totalPages,
    isTyping,
    setUserTyping,
  };
}
