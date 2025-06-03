'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  available: boolean;
  images: string[];
  amenities: string[];
}

export default function DashboardPropertiesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isLandlordOrAdmin = user?.role === 'LANDLORD' || user?.role === 'ADMIN' || user?.role === 'AGENT';

  useEffect(() => {
    // Redirect if not landlord or admin
    if (!isLoading && !isLandlordOrAdmin) {
      router.push('/dashboard');
      return;
    }

    const fetchProperties = async () => {
      try {
        const data = await api.get<Property[]>('/properties/my-properties');
        setProperties(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load your properties');
      } finally {
        setLoading(false);
      }
    };

    if (isLandlordOrAdmin) {
      fetchProperties();
    }
  }, [isLandlordOrAdmin, router]);

  const handleDelete = async (propertyId: string) => {
    if (deleteConfirm !== propertyId) {
      setDeleteConfirm(propertyId);
      return;
    }

    try {
      await api.delete(`/properties/${propertyId}`);
      setProperties(properties.filter((property) => property.id !== propertyId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
    }
  };

  const toggleAvailability = async (propertyId: string, available: boolean) => {
    try {
      await api.put(`/properties/${propertyId}`, { available: !available });
      setProperties(
        properties.map((property) =>
          property.id === propertyId
            ? { ...property, available: !available }
            : property
        )
      );
    } catch (err) {
      console.error('Error updating property availability:', err);
      setError('Failed to update property availability');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Link
          href="/properties/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
        >
          Add New Property
        </Link>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {properties.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">You don't have any properties yet.</p>
          <Link
            href="/properties/create"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Add Your First Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 h-48 md:h-auto relative">
                  {property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                    property.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {property.available ? 'Available' : 'Not Available'}
                  </div>
                </div>
                <div className="p-6 md:w-2/3">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{property.title}</h2>
                      <p className="text-gray-600 text-sm mb-4">
                        {property.address}, {property.city}, {property.country}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="font-semibold">${property.price}/night</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bedrooms</p>
                          <p className="font-semibold">{property.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bathrooms</p>
                          <p className="font-semibold">{property.bathrooms}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-col gap-2">
                      <div className="flex space-x-2">
                        <Link
                          href={`/properties/${property.id}`}
                          className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200"
                        >
                          View
                        </Link>
                        
                        <Link
                          href={`/properties/${property.id}/edit`}
                          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200"
                        >
                          Edit
                        </Link>
                        
                        <button
                          onClick={() => handleDelete(property.id)}
                          className={`px-4 py-2 rounded-md ${
                            deleteConfirm === property.id
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {deleteConfirm === property.id ? 'Confirm' : 'Delete'}
                        </button>
                      </div>
                      
                      <button
                        onClick={() => toggleAvailability(property.id, property.available)}
                        className={`mt-2 px-4 py-2 rounded-md ${
                          property.available
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {property.available ? 'Mark as Unavailable' : 'Mark as Available'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
