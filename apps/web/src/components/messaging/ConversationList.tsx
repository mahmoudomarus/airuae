'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Conversation, useConversations } from '../../hooks/useConversations';
import { useAuthContext } from '../../context/AuthContext';

export default function ConversationList() {
  const router = useRouter();
  const { conversations, loading, error } = useConversations();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Get other participants (not the current user)
  const getOtherParticipants = (conversation: Conversation) => {
    return conversation.participants.filter(p => p.id !== user?.id);
  };

  // Get conversation name based on participants or title
  const getConversationName = (conversation: Conversation) => {
    if (conversation.title && conversation.title !== 'New Conversation') {
      return conversation.title;
    }

    const others = getOtherParticipants(conversation);
    return others.map(p => `${p.firstName || ''} ${p.lastName || ''}`).join(', ');
  };

  // Get avatar for the conversation
  const getConversationAvatar = (conversation: Conversation) => {
    // If there's a property, use its first image
    if (conversation.property?.images?.length) {
      return conversation.property.images[0];
    }

    // Otherwise, use the first other participant's avatar
    const others = getOtherParticipants(conversation);
    return others[0]?.profileImage || '/placeholder-avatar.png';
  };

  // Get last message preview
  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'No messages yet';
    }

    const lastMessage = conversation.messages[0];
    return lastMessage.content.length > 30
      ? `${lastMessage.content.substring(0, 30)}...`
      : lastMessage.content;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise, show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => {
    const name = getConversationName(conversation).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Handle conversation click
  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col h-full">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {conversations.length === 0 ? "You don't have any conversations yet" : "No conversations matching your search"}
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredConversations.map(conversation => (
              <li
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors relative"
              >
                <div className="flex items-start">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={getConversationAvatar(conversation)}
                      alt={getConversationName(conversation)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                    
                    {conversation.property && (
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {conversation.property.title}
                      </div>
                    )}
                  </div>
                </div>
                
                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <div className="absolute right-3 top-3 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
