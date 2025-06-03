'use client';

import Link from 'next/link';
import { useAuthContext } from '../context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-600">AirUAE</h1>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">
                  Welcome, {user?.firstName || user?.email}
                </span>
                <button
                  onClick={logout}
                  className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Find your perfect stay in the UAE
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-500">
            Book short-term stays or find your dream long-term home
          </p>
        </div>

        {/* Search Form Placeholder */}
        <div className="mt-10 max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="Where are you going?"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Dates
              </label>
              <input
                type="text"
                id="date"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="Add dates"
              />
            </div>
            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
                Guests
              </label>
              <input
                type="text"
                id="guests"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="Add guests"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </div>
        </div>

        {/* Rental Types */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900">Rental Options</h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900">Short-Term Rentals</h4>
                <p className="mt-2 text-gray-600">
                  Perfect for vacations, business trips, or temporary stays. Book nightly, weekly, or monthly.
                </p>
                <div className="mt-4">
                  <Link
                    href="/search?type=short-term"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Explore short-term options →
                  </Link>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900">Long-Term Rentals</h4>
                <p className="mt-2 text-gray-600">
                  Find your perfect home with yearly leases. Schedule viewings or apply directly online.
                </p>
                <div className="mt-4">
                  <Link
                    href="/search?type=long-term"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Explore long-term options →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
