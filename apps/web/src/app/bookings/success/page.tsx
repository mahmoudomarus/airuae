'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Get the booking ID or session ID from URL
  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        if (bookingId) {
          // Fetch booking directly
          const booking = await api.get(`/bookings/${bookingId}`);
          setBookingDetails(booking);
        } else if (sessionId) {
          // Fetch session and then get the booking ID from it
          const session = await api.get(`/payments/sessions/${sessionId}`);
          if (session.metadata?.bookingId) {
            const booking = await api.get(`/bookings/${session.metadata.bookingId}`);
            setBookingDetails(booking);
          } else {
            setError('Booking information not found in session');
          }
        } else {
          setError('No booking or session information provided');
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, sessionId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Confirming your booking...</p>
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
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for your booking. Your payment has been processed successfully.
            </p>
          </div>

          {bookingDetails && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-lg">{bookingDetails.property.title}</h3>
                <p className="text-gray-600">
                  {bookingDetails.property.address}, {bookingDetails.property.city}, {bookingDetails.property.country}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="font-medium">
                    {new Date(bookingDetails.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out</p>
                  <p className="font-medium">
                    {new Date(bookingDetails.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guests</p>
                  <p className="font-medium">2 guests</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="font-medium">${bookingDetails.totalPrice.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="font-medium mb-2">Important Information</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>
                    <span className="font-medium">Check-in time:</span> After 3:00 PM
                  </li>
                  <li>
                    <span className="font-medium">Check-out time:</span> Before 11:00 AM
                  </li>
                  <li>
                    <span className="font-medium">Cancellation policy:</span> Free cancellation up to 48 hours before check-in
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  A confirmation email has been sent to your email address.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href={`/bookings/${bookingDetails.id}`}
                    className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    View Booking Details
                  </Link>
                  <Link
                    href="/bookings"
                    className="inline-block px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    View All Bookings
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
