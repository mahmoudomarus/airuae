'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useMessages } from '../../hooks/useMessages';
import { Conversation, Message, User } from '../../hooks/useConversations';
import { useAuthContext } from '../../context/AuthContext';

interface MessageThreadProps {
  conversation: Conversation;
}

export default function MessageThread({ conversation }: MessageThreadProps) {
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthContext();
  const {
    messages,
    loading,
    error,
    sendMessage,
    loadMoreMessages,
    hasMoreMessages,
    isTyping,
    setUserTyping,
  } = useMessages({ conversationId: conversation.id });

  // Format date for message timestamp
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get participant name
  const getParticipantName = (participant: User) => {
    return `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.email;
  };

  // Get all users who are currently typing
  const getTypingUsers = () => {
    const typingUserIds = Object.entries(isTyping)
      .filter(([userId, isTyping]) => isTyping && userId !== user?.id)
      .map(([userId]) => userId);

    if (typingUserIds.length === 0) return null;

    const typingUsers = conversation.participants.filter(p => typingUserIds.includes(p.id));
    
    if (typingUsers.length === 1) {
      return `${getParticipantName(typingUsers[0])} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${getParticipantName(typingUsers[0])} and ${getParticipantName(typingUsers[1])} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    setUserTyping(true);

    // Stop typing indicator after a timeout
    clearTimeout((window as any).typingTimeout);
    (window as any).typingTimeout = setTimeout(() => {
      setUserTyping(false);
    }, 1000);
  };

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      setSendingMessage(true);
      setUserTyping(false);
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Render message groups by sender
  const renderMessageGroups = () => {
    if (!messages.length) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">No messages yet. Start a conversation!</p>
        </div>
      );
    }

    // Group consecutive messages from the same sender
    const messageGroups: Message[][] = [];
    let currentGroup: Message[] = [];

    messages.forEach((message, index) => {
      // Start a new group if this is the first message or the sender changed
      if (index === 0 || messages[index - 1].sender.id !== message.sender.id) {
        if (currentGroup.length > 0) {
          messageGroups.push(currentGroup);
        }
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    // Add the last group
    if (currentGroup.length > 0) {
      messageGroups.push(currentGroup);
    }

    return messageGroups.map((group, groupIndex) => {
      const isCurrentUser = group[0].sender.id === user?.id;
      return (
        <div
          key={`group-${groupIndex}`}
          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
          {!isCurrentUser && (
            <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
              <Image
                src={group[0].sender.profileImage || '/placeholder-avatar.png'}
                alt={getParticipantName(group[0].sender)}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} ml-2`}>
            {!isCurrentUser && (
              <span className="text-xs text-gray-500 mb-1">
                {getParticipantName(group[0].sender)}
              </span>
            )}
            
            <div className="space-y-1">
              {group.map(message => (
                <div
                  key={message.id}
                  className={`px-4 py-2 rounded-lg max-w-xs sm:max-w-md break-words ${
                    isCurrentUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.content}
                  <span className="text-xs opacity-70 ml-2">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="bg-white border-b p-4">
        <h2 className="text-lg font-semibold">
          {conversation.title && conversation.title !== 'New Conversation'
            ? conversation.title
            : conversation.participants
                .filter(p => p.id !== user?.id)
                .map(getParticipantName)
                .join(', ')}
        </h2>
        {conversation.property && (
          <p className="text-sm text-gray-600">
            {conversation.property.title}
          </p>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => loadMoreMessages()}
                  className="text-indigo-600 text-sm hover:underline"
                >
                  Load more messages
                </button>
              </div>
            )}
            
            {renderMessageGroups()}
            
            {/* Typing indicator */}
            {getTypingUsers() && (
              <div className="text-gray-500 text-sm italic mt-2">
                {getTypingUsers()}
              </div>
            )}
            
            {/* Ref for scrolling to bottom */}
            <div ref={messagesEndRef}></div>
          </>
        )}
      </div>

      {/* Message input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <textarea
            className="flex-1 min-h-[60px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Type a message..."
            value={messageInput}
            onChange={handleInputChange}
            disabled={sendingMessage}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || sendingMessage}
            className={`px-4 py-3 bg-indigo-600 text-white rounded-md ${
              !messageInput.trim() || sendingMessage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
            }`}
          >
            {sendingMessage ? (
              <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
