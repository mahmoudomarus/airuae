'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Conversation } from '../../../hooks/useConversations';
import MessageThread from '../../../components/messaging/MessageThread';

interface ConversationPageProps {
  params: { id: string };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { id } = params;
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        if (!isAuthenticated) {
          router.push('/auth/login?redirect=' + encodeURIComponent(`/messages/${id}`));
          return;
        }

        setLoading(true);
        const data = await api.get<Conversation>(`/messaging/conversations/${id}`);
        setConversation(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [id, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error || 'Conversation not found'}</span>
        </div>
        <div className="mt-4">
          <Link href="/messages" className="text-indigo-600 hover:text-indigo-800">
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4">
        <Link href="/messages" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Messages
        </Link>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <MessageThread conversation={conversation} />
      </div>
    </div>
  );
}
