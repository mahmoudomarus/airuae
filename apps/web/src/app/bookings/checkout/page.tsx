'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuthContext } from '../../../context/AuthContext';
import StripeProvider from '../../../components/payments/StripeProvider';
import PaymentForm from '../../../components/payments/PaymentForm';

interface Booking {
  id: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    country: string;
    images: string[];
  };
  startDate: string;
  endDate: string;
  totalPrice: number;
  nights: number;
  status: string;
  createdAt: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthContext();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Get the booking ID from URL
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/bookings/checkout?bookingId=${bookingId}`));
      return;
    }

    const fetchBooking = async () => {
      if (!bookingId) {
        setError('Booking ID is required');
        setLoading(false);
        return;
      }

      try {
        const data = await api.get<Booking>(`/bookings/${bookingId}`);
        setBooking(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, isAuthenticated, router]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentSuccess(true);
    
    // Update the booking status
    api.put(`/bookings/${bookingId}/status`, {
      status: 'CONFIRMED',
      paymentIntentId,
    }).catch((err) => {
      console.error('Error updating booking status:', err);
    });
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(`Payment failed: ${errorMessage}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Link href="/bookings" className="text-indigo-600 hover:text-indigo-800">
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Notice:</strong>
          <span className="block sm:inline"> Booking not found</span>
        </div>
        <div className="mt-4">
          <Link href="/properties" className="text-indigo-600 hover:text-indigo-800">
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Your payment was processed successfully!</span>
        </div>
        <div className="mt-4 text-center">
          <p className="mb-4">Your booking is now confirmed. Check your email for the confirmation details.</p>
          <Link 
            href={`/bookings/${booking.id}`} 
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            View Booking Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/bookings" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to My Bookings
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
            
            <StripeProvider>
              <PaymentForm 
                bookingId={booking.id}
                totalAmount={booking.totalPrice}
                propertyTitle={booking.property.title}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </StripeProvider>
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
            
            <div className="mb-4">
              <div className="aspect-w-16 aspect-h-9 mb-2">
                {booking.property.images && booking.property.images.length > 0 ? (
                  <img
                    src={booking.property.images[0]}
                    alt={booking.property.title}
                    className="rounded-md object-cover w-full h-32"
                  />
                ) : (
                  <div className="rounded-md bg-gray-200 w-full h-32 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <h3 className="font-medium">{booking.property.title}</h3>
              <p className="text-gray-600 text-sm">
                {booking.property.address}, {booking.property.city}, {booking.property.country}
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span>Check-in:</span>
                <span className="font-medium">{formatDate(booking.startDate)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Check-out:</span>
                <span className="font-medium">{formatDate(booking.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span>Total:</span>
                <span className="font-bold">${booking.totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Includes all fees and taxes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
