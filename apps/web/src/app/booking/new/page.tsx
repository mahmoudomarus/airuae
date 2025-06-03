'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  images: string[];
  amenities: string[];
  available: boolean;
}

export default function CreateBookingPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(0);

  useEffect(() => {
    if (!propertyId) {
      router.push('/properties');
      return;
    }

    const fetchProperty = async () => {
      try {
        const data = await api.get<Property>(`/properties/${propertyId}`);
        setProperty(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, router]);

  useEffect(() => {
    // Calculate total price and nights when dates change
    if (startDate && endDate && property) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (start >= end) {
        setTotalPrice(0);
        setNights(0);
        return;
      }
      
      // Calculate nights
      const timeDiff = end.getTime() - start.getTime();
      const nightCount = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      setNights(nightCount);
      setTotalPrice(nightCount * property.price);
    }
  }, [startDate, endDate, property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/booking/new?propertyId=${propertyId}`);
      return;
    }
    
    if (!startDate || !endDate || !propertyId) {
      setError('Please select valid dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      setError('End date must be after start date');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const bookingData = {
        startDate,
        endDate,
        propertyId,
        totalPrice,
        nights,
      };
      
      await api.post('/bookings', bookingData);
      router.push('/booking/success');
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err?.message || 'Failed to create booking. Please try again.');
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

  if (error && !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
            Back to properties
          </Link>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Property not found</span>
        </div>
        <div className="mt-4">
          <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
            Back to properties
          </Link>
        </div>
      </div>
    );
  }

  if (!property.available) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Available!</strong>
          <span className="block sm:inline"> This property is not available for booking.</span>
        </div>
        <div className="mt-4">
          <Link href={`/properties/${property.id}`} className="text-indigo-600 hover:text-indigo-800">
            Back to property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/properties/${property.id}`} className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to property
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Property Summary */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Property Summary</h2>
            
            {property.images.length > 0 && (
              <div className="mb-4">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              </div>
            )}
            
            <h3 className="text-lg font-bold">{property.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{property.address}, {property.city}, {property.country}</p>
            
            <div className="mt-4 flex items-center">
              <span className="text-xl font-bold">${property.price}</span>
              <span className="text-gray-600 ml-1">/ night</span>
            </div>
            
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="mr-3">{property.bedrooms} beds</span>
              <span>{property.bathrooms} baths</span>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Book Your Stay</h2>
            
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Today's date as minimum
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]} // Start date or today as minimum
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              {nights > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>
                      ${property.price} x {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span>${totalPrice}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting || nights === 0}
                  className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium ${
                    (submitting || nights === 0) ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Processing...' : 'Reserve'}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                You won't be charged yet
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
