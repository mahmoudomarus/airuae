'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  nights: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    country: string;
    images: string[];
  };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/booking/my-bookings');
      return;
    }

    const fetchBookings = async () => {
      try {
        const data = await api.get<Booking[]>('/bookings/my-bookings');
        setBookings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, router]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`, {});
      
      // Update the booking status in the local state
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: 'CANCELLED' as const }
            : booking
        )
      );
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return null; // We're redirecting in the useEffect
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <div className="flex justify-center">
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">You don't have any bookings yet.</p>
          <Link
            href="/properties"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/4 h-48 md:h-auto relative">
                  {booking.property.images.length > 0 ? (
                    <img
                      src={booking.property.images[0]}
                      alt={booking.property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.status}
                  </div>
                </div>
                <div className="p-6 md:w-3/4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{booking.property.title}</h2>
                      <p className="text-gray-600 text-sm mb-4">
                        {booking.property.address}, {booking.property.city}, {booking.property.country}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        <div>
                          <span className="font-semibold">Check-in:</span> {formatDate(booking.startDate)}
                        </div>
                        <div>
                          <span className="font-semibold">Check-out:</span> {formatDate(booking.endDate)}
                        </div>
                        <div>
                          <span className="font-semibold">Nights:</span> {booking.nights}
                        </div>
                      </div>
                      
                      <div className="text-lg font-bold">
                        Total: ${booking.totalPrice}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex md:flex-col gap-2">
                      <Link
                        href={`/properties/${booking.property.id}`}
                        className="text-indigo-600 hover:text-indigo-800 px-4 py-2 border border-indigo-600 rounded-md text-center text-sm"
                      >
                        View Property
                      </Link>
                      
                      {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:text-red-800 px-4 py-2 border border-red-600 rounded-md text-sm"
                        >
                          Cancel Booking
                        </button>
                      )}
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
