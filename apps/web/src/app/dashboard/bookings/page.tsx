'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function DashboardBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
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
  }, []);

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

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') {
      return ['PENDING', 'CONFIRMED'].includes(booking.status) && new Date(booking.startDate) > new Date();
    }
    if (activeTab === 'past') {
      return new Date(booking.endDate) < new Date();
    }
    if (activeTab === 'cancelled') {
      return booking.status === 'CANCELLED';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`mr-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`mr-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'upcoming'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`mr-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'past'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`mr-1 py-2 px-4 text-sm font-medium ${
              activeTab === 'cancelled'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
            }`}
          >
            Cancelled
          </button>
        </nav>
      </div>
      
      {filteredBookings.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No bookings found in this category.</p>
          <Link
            href="/properties"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 h-48 md:h-auto relative">
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
                <div className="p-6 md:w-2/3">
                  <h2 className="text-xl font-bold mb-2">{booking.property.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {booking.property.address}, {booking.property.city}, {booking.property.country}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Check-in</p>
                      <p className="font-semibold">{formatDate(booking.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Check-out</p>
                      <p className="font-semibold">{formatDate(booking.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Nights</p>
                      <p className="font-semibold">{booking.nights}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold">
                      Total: ${booking.totalPrice}
                    </p>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/properties/${booking.property.id}`}
                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200"
                      >
                        View Property
                      </Link>
                      
                      {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && 
                       new Date(booking.startDate) > new Date() && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200"
                        >
                          Cancel
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
