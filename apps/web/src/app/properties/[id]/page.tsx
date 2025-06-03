'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import PropertyMap from '../../../components/maps/PropertyMap';
import { useAuthContext } from '../../../context/AuthContext';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  zipCode?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  size?: number;
  images: string[];
  amenities: string[];
  available: boolean;
  createdAt: string;
  ownerId: string;
  owner?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  latitude?: number;
  longitude?: number;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Get the Google Maps API key
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const data = await api.get<Property>(`/properties/${params.id}`);
        setProperty(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }
  }, [params.id]);

  useEffect(() => {
    if (checkInDate && checkOutDate && property) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      
      if (start < end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(diffDays);
        setTotalPrice(diffDays * property.price);
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    } else {
      setNights(0);
      setTotalPrice(0);
    }
  }, [checkInDate, checkOutDate, property]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/properties/${params.id}`));
      return;
    }

    if (checkInDate && checkOutDate && nights > 0) {
      router.push(`/bookings/new?propertyId=${property?.id}&checkIn=${checkInDate}&checkOut=${checkOutDate}&nights=${nights}&totalPrice=${totalPrice}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Properties
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Property Images */}
        <div className="h-96 overflow-hidden relative">
          {property.images && property.images.length > 0 ? (
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
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start">
            <div className="w-full lg:w-2/3 pr-0 lg:pr-8">
              {/* Title and Basic Info */}
              <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
              <p className="text-gray-600 mb-4">{property.address}, {property.city}, {property.country}</p>

              <div className="flex flex-wrap mb-6">
                <div className="mr-6">
                  <span className="font-semibold">{property.bedrooms}</span> bedrooms
                </div>
                <div className="mr-6">
                  <span className="font-semibold">{property.bathrooms}</span> bathrooms
                </div>
                {property.size && (
                  <div>
                    <span className="font-semibold">{property.size}</span> sqm
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Amenities</h2>
                {property.amenities.length === 0 ? (
                  <p className="text-gray-500">No amenities listed</p>
                ) : (
                  <div className="flex flex-wrap">
                    {property.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm mr-2 mb-2"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Map */}
              {property.latitude && property.longitude && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-2">Location</h2>
                  <PropertyMap
                    apiKey={googleMapsApiKey}
                    properties={[property]}
                    center={{
                      lat: property.latitude,
                      lng: property.longitude,
                    }}
                    zoom={15}
                    height="400px"
                  />
                </div>
              )}
            </div>

            <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
              {/* Booking Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">${property.price}</h3>
                  <p className="text-gray-600">per night</p>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="check-in" className="block text-sm font-medium text-gray-700 mb-1">
                        Check-in
                      </label>
                      <input
                        type="date"
                        id="check-in"
                        min={today}
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="check-out" className="block text-sm font-medium text-gray-700 mb-1">
                        Check-out
                      </label>
                      <input
                        type="date"
                        id="check-out"
                        min={checkInDate || today}
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span>${property.price} x {nights} nights</span>
                      <span>${totalPrice}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${totalPrice}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBookNow}
                  disabled={!checkInDate || !checkOutDate || nights === 0 || !property.available}
                  className={`w-full py-3 px-4 ${
                    property.available
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } rounded-md font-medium`}
                >
                  {property.available ? 'Book Now' : 'Not Available'}
                </button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    You need to{' '}
                    <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800">
                      log in
                    </Link>{' '}
                    to book.
                  </p>
                )}
              </div>

              {/* Host Info */}
              <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Hosted by</h3>
                <p className="text-gray-700">
                  {property.owner?.firstName
                    ? `${property.owner.firstName} ${property.owner.lastName || ''}`
                    : 'Property Owner'}
                </p>
                <button className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50">
                  Contact Host
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
