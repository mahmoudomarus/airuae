'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  size?: number;
  images: string[];
  amenities: string[];
  available: boolean;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const data = await api.get<Property>(`/properties/${id}`);
        setProperty(data);
        setError(null);
      } catch (err) {
        setError('Failed to load property details');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      await api.delete(`/properties/${id}`);
      router.push('/properties');
    } catch (err) {
      setError('Failed to delete property');
      console.error('Error deleting property:', err);
      setDeleteConfirm(false);
    }
  };

  const isOwner = isAuthenticated && property?.owner.id === user?.id;
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error || 'Property not found'}</span>
        </div>
        <div className="mt-4">
          <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
            &larr; Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Properties
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Property Images */}
        <div className="lg:w-2/3">
          {property.images.length > 0 ? (
            <div className="bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-96 object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-200 rounded-lg">
              <span className="text-gray-400">No image available</span>
            </div>
          )}

          {/* Image Gallery */}
          {property.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {property.images.slice(1).map((image, index) => (
                <div key={index} className="h-24 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`${property.title} - ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property Details and Booking */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
            <p className="text-gray-600 mb-4">
              {property.address}, {property.city}, {property.country}
            </p>
            
            <div className="border-t border-b py-4 my-4">
              <div className="flex items-center text-sm text-gray-700 mb-2">
                <span className="mr-3">{property.bedrooms} bedrooms</span>
                <span>{property.bathrooms} bathrooms</span>
              </div>
              {property.size && (
                <div className="text-sm text-gray-700">
                  <span>{property.size} sqm</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4 mt-4">
              <div>
                <span className="text-2xl font-bold">${property.price}</span>
                <span className="text-gray-600"> / night</span>
              </div>
              <Link
                href={`/booking/new?propertyId=${property.id}`}
                className={`px-4 py-2 rounded-md ${property.available ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                aria-disabled={!property.available}
              >
                {property.available ? 'Book Now' : 'Not Available'}
              </Link>
            </div>

            {/* Owner Actions */}
            {canEdit && (
              <div className="border-t mt-6 pt-4">
                <h3 className="font-semibold mb-2">Owner Actions</h3>
                <div className="flex space-x-2">
                  <Link
                    href={`/properties/${property.id}/edit`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className={`px-3 py-1 rounded ${
                      deleteConfirm
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {deleteConfirm ? 'Confirm Delete' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Description */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">About this property</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
        </div>
      </div>

      {/* Host Information */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Host information</h2>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-2xl mr-4">
            {property.owner.firstName?.charAt(0) || property.owner.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold">
              {property.owner.firstName && property.owner.lastName
                ? `${property.owner.firstName} ${property.owner.lastName}`
                : 'Anonymous Host'}
            </h3>
            <p className="text-gray-600 text-sm">
              Contact: {property.owner.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
