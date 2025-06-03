'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  totalProperties?: number;
  activeProperties?: number;
}

interface Property {
  id: string;
  title: string;
  city: string;
  price: number;
  images: string[];
}

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  property: {
    id: string;
    title: string;
    city: string;
    images: string[];
  };
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    activeBookings: 0,
    totalProperties: 0,
    activeProperties: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const isLandlordOrAdmin = user?.role === 'LANDLORD' || user?.role === 'ADMIN' || user?.role === 'AGENT';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real implementation, this would be a single API call to get dashboard data
        // For now, we'll simulate it by making separate calls

        // Fetch user bookings
        const bookings = await api.get<Booking[]>('/bookings/my-bookings');
        
        // Calculate booking stats
        const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
        const activeBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
        
        // Get recent bookings (latest 3)
        const sortedBookings = [...bookings].sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        setRecentBookings(sortedBookings.slice(0, 3));

        const dashboardStats: DashboardStats = {
          totalBookings: bookings.length,
          pendingBookings,
          activeBookings,
        };

        // If user is a landlord or admin, fetch properties too
        if (isLandlordOrAdmin) {
          const properties = await api.get<Property[]>('/properties/my-properties');
          
          // Calculate property stats
          const activeProperties = properties.filter(p => p.price > 0).length;
          
          // Get recent properties (latest 3)
          const sortedProperties = [...properties].sort((a, b) => b.price - a.price);
          setRecentProperties(sortedProperties.slice(0, 3));
          
          dashboardStats.totalProperties = properties.length;
          dashboardStats.activeProperties = activeProperties;
        }
        
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLandlordOrAdmin, user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">Total Bookings</h2>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">Pending Bookings</h2>
              <p className="text-2xl font-bold">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-600">Active Bookings</h2>
              <p className="text-2xl font-bold">{stats.activeBookings}</p>
            </div>
          </div>
        </div>
        
        {isLandlordOrAdmin && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-600">Total Properties</h2>
                  <p className="text-2xl font-bold">{stats.totalProperties}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-600">Active Properties</h2>
                  <p className="text-2xl font-bold">{stats.activeProperties}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          </div>
          
          {recentBookings.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No bookings found
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                      {booking.property.images && booking.property.images.length > 0 ? (
                        <img 
                          src={booking.property.images[0]} 
                          alt={booking.property.title} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {booking.property.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${booking.totalPrice}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Recent Properties - Only for landlords and admins */}
        {isLandlordOrAdmin && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Your Properties</h2>
              <Link href="/dashboard/properties" className="text-sm text-indigo-600 hover:text-indigo-800">
                View All
              </Link>
            </div>
            
            {recentProperties.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No properties found
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentProperties.map((property) => (
                  <li key={property.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                        {property.images && property.images.length > 0 ? (
                          <img 
                            src={property.images[0]} 
                            alt={property.title} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {property.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {property.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${property.price}/night</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/properties"
            className="flex items-center p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Browse Properties</span>
          </Link>
          
          <Link
            href="/dashboard/bookings"
            className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>View My Bookings</span>
          </Link>
          
          {isLandlordOrAdmin && (
            <>
              <Link
                href="/dashboard/properties"
                className="flex items-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Manage Properties</span>
              </Link>
              
              <Link
                href="/properties/create"
                className="flex items-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add New Property</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
