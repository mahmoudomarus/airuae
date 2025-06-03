'use client';

import { useState } from 'react';
import { useConversations } from '../../hooks/useConversations';
import ConversationList from '../../components/messaging/ConversationList';
import CreateConversationModal from '../../components/messaging/CreateConversationModal';

export default function MessagesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Messages</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          New Conversation
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <ConversationList />
        </div>
      </div>
      
      <CreateConversationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
