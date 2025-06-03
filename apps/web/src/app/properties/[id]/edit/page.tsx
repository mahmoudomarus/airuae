'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  size?: number;
  images: string[];
  amenities: string[];
  available: boolean;
  owner: {
    id: string;
  };
}

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
  available: boolean;
}

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
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
    available: true,
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const property = await api.get<Property>(`/properties/${id}`);
        
        // Check if user is authorized to edit
        if (
          !isAuthenticated || 
          (property.owner.id !== user?.id && user?.role !== 'ADMIN')
        ) {
          router.push(`/properties/${id}`);
          return;
        }
        
        // Convert numbers to strings for form inputs
        setFormData({
          title: property.title,
          description: property.description || '',
          address: property.address,
          city: property.city,
          country: property.country,
          zipCode: property.zipCode || '',
          price: property.price.toString(),
          bedrooms: property.bedrooms.toString(),
          bathrooms: property.bathrooms.toString(),
          size: property.size?.toString() || '',
          images: property.images,
          amenities: property.amenities,
          available: property.available,
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property. Please try again.');
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, isAuthenticated, router, user]);

  // Form utility functions
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
    setSubmitting(true);
    setError(null);

    try {
      // Convert string values to numbers where needed
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        zipCode: formData.zipCode,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms, 10),
        bathrooms: parseInt(formData.bathrooms, 10),
        size: formData.size ? parseFloat(formData.size) : undefined,
        images: formData.images,
        amenities: formData.amenities,
        available: formData.available,
      };

      await api.put(`/properties/${id}`, propertyData);
      router.push(`/properties/${id}`);
    } catch (err) {
      console.error('Error updating property:', err);
      setError('Failed to update property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/properties/${id}`} className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Property
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Property</h1>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Form content similar to create page */}
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
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
                  />
                </div>

                <div>
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
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    name="available"
                    checked={formData.available}
                    onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
                    Property is available for booking
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
