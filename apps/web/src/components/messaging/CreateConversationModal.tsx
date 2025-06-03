'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConversations } from '../../hooks/useConversations';
import { api } from '../../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
}

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  bookingId?: string;
}

export default function CreateConversationModal({
  isOpen,
  onClose,
  propertyId,
  bookingId,
}: CreateConversationModalProps) {
  const router = useRouter();
  const { createConversation } = useConversations();
  
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | undefined>(propertyId);
  const [title, setTitle] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users and properties
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, propertiesResponse] = await Promise.all([
          api.get<User[]>('/users'),
          api.get<Property[]>('/properties'),
        ]);
        
        setUsers(usersResponse);
        setProperties(propertiesResponse);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load users or properties');
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = user.email.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return fullName.includes(term) || email.includes(term);
  });

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    if (!initialMessage.trim()) {
      setError('Please enter an initial message');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const conversation = await createConversation({
        participantIds: selectedUsers,
        title: title || undefined,
        propertyId: selectedProperty,
        bookingId,
        initialMessage,
      });
      
      // Redirect to the new conversation
      router.push(`/messages/${conversation.id}`);
      onClose();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">New Conversation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {/* Optional Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Conversation Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Inquiry about property"
              />
            </div>
            
            {/* Property Selection (if not provided) */}
            {!propertyId && (
              <div>
                <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">
                  Related Property (Optional)
                </label>
                <select
                  id="property"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedProperty || ''}
                  onChange={(e) => setSelectedProperty(e.target.value || undefined)}
                >
                  <option value="">None</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.title} - {property.address}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Recipients*
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md mb-2"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-2 text-gray-500">No users found</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <li
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className={`p-2 cursor-pointer hover:bg-gray-50 ${
                          selectedUsers.includes(user.id) ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Initial Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Message*
              </label>
              <textarea
                id="message"
                className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your message here..."
                required
              />
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
          </div>
        </form>
        
        <div className="border-t p-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md mr-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedUsers.length === 0 || !initialMessage.trim()}
            className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
              isLoading || selectedUsers.length === 0 || !initialMessage.trim()
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-indigo-700'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Conversation'}
          </button>
        </div>
      </div>
    </div>
  );
}
