'use client';

import Link from 'next/link';

export default function BookingSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Your booking has been successfully created. We have sent you a confirmation email with all the details.
        </p>
        <div className="flex flex-col space-y-3">
          <Link
            href="/booking/my-bookings"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
          >
            View My Bookings
          </Link>
          <Link
            href="/properties"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Continue Browsing Properties
          </Link>
        </div>
      </div>
    </div>
  );
}
