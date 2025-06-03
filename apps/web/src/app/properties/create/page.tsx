'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

interface FormData {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  images: string[];
  amenities: string[];
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [amenity, setAmenity] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    size: '',
    images: [],
    amenities: [],
  });

  // Check if user is authenticated and has the right role
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Unauthorized!</strong>
          <span className="block sm:inline"> You need to be logged in to create a property.</span>
        </div>
        <div className="mt-4">
          <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role !== 'LANDLORD' && user?.role !== 'ADMIN' && user?.role !== 'AGENT') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Unauthorized!</strong>
          <span className="block sm:inline"> Only landlords, agents, and admins can create properties.</span>
        </div>
        <div className="mt-4">
          <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addAmenity = () => {
    if (amenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity.trim()],
      }));
      setAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert string values to numbers where needed
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms, 10),
        bathrooms: parseInt(formData.bathrooms, 10),
        size: formData.size ? parseFloat(formData.size) : undefined,
      };

      await api.post('/properties', propertyData);
      router.push('/properties');
    } catch (err) {
      console.error('Error creating property:', err);
      setError('Failed to create property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Properties
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Property</h1>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter property title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe your property"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter property address"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter country"
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter zip code"
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price per night *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter price"
                  />
                </div>

                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    required
                    min="0"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Number of bedrooms"
                  />
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    required
                    min="0"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Number of bathrooms"
                  />
                </div>

                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                    Size (sqm)
                  </label>
                  <input
                    type="number"
                    id="size"
                    name="size"
                    min="0"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Property size"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Images</h2>
              <div className="flex mb-4">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter image URL"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Property image ${index + 1}`}
                        className="h-32 w-full object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Amenities</h2>
              <div className="flex mb-4">
                <input
                  type="text"
                  value={amenity}
                  onChange={(e) => setAmenity(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter amenity (e.g. WiFi, Pool, etc.)"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.amenities.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm flex items-center"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
