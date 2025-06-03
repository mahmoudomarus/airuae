'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import { useAuthContext } from '../context/AuthContext';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  country: string;
  images: string[];
}

export interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: User;
  conversationId: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  participants: User[];
  property?: Property;
  booking?: Booking;
  messages: Message[];
  unreadCount?: number;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  createConversation: (data: {
    participantIds: string[];
    title?: string;
    propertyId?: string;
    bookingId?: string;
    initialMessage?: string;
  }) => Promise<Conversation>;
  getUnreadCount: () => Promise<number>;
  refreshConversations: () => void;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();
  const { isAuthenticated } = useAuthContext();

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get<Conversation[]>('/messaging/conversations');
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle new message
    const handleNewMessage = (message: Message) => {
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === message.conversationId) {
            // Add message to conversation and update last message
            return {
              ...conv,
              messages: [message, ...conv.messages],
              updatedAt: message.createdAt,
              unreadCount: (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
      });
    };

    // Handle messages read
    const handleMessagesRead = (data: { conversationId: string; userId: string }) => {
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === data.conversationId) {
            // Mark messages as read
            return {
              ...conv,
              unreadCount: 0,
              messages: conv.messages.map(msg => {
                if (!msg.readAt && msg.sender.id !== data.userId) {
                  return { ...msg, readAt: new Date().toISOString() };
                }
                return msg;
              }),
            };
          }
          return conv;
        });
      });
    };

    // Listen for socket events
    socket.on('newMessage', handleNewMessage);
    socket.on('messagesRead', handleMessagesRead);

    // Clean up
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, isConnected]);

  // Create a new conversation
  const createConversation = async (data: {
    participantIds: string[];
    title?: string;
    propertyId?: string;
    bookingId?: string;
    initialMessage?: string;
  }): Promise<Conversation> => {
    try {
      const newConversation = await api.post<Conversation>('/messaging/conversations', data);
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw new Error('Failed to create conversation');
    }
  };

  // Get unread message count
  const getUnreadCount = async (): Promise<number> => {
    try {
      const response = await api.get<{ unreadCount: number }>('/messaging/unread-count');
      return response.unreadCount;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  };

  return {
    conversations,
    loading,
    error,
    createConversation,
    getUnreadCount,
    refreshConversations: fetchConversations,
  };
}
