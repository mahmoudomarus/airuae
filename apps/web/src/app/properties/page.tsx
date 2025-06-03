'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '../../context/AuthContext';
import { api } from '../../lib/api';

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
  images: string[];
  amenities: string[];
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const data = await api.get<Property[]>('/properties');
        setProperties(data);
        setError(null);
      } catch (err) {
        setError('Failed to load properties');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Properties</h1>
        <div className="flex justify-center">
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Properties</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Properties</h1>
        {isAuthenticated && (
          <Link
            href="/properties/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Add New Property
          </Link>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              href={`/properties/${property.id}`}
              key={property.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gray-200 relative">
                {property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-indigo-600 text-white px-3 py-1">
                  ${property.price}/night
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{property.city}, {property.country}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-3">{property.bedrooms} beds</span>
                  <span>{property.bathrooms} baths</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
