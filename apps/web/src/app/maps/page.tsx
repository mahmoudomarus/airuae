'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PropertyMap from '../../components/maps/PropertyMap';
import { api } from '../../lib/api';

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
  latitude: number;
  longitude: number;
}

interface SearchParams {
  query?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  lat?: string;
  lng?: string;
  distance?: string;
}

export default function MapView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<SearchParams>({});
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Get the Google Maps API key
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // Function to fetch properties based on search params
  const fetchProperties = useCallback(async (params: SearchParams) => {
    setLoading(true);
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const data = await api.get<{ results: Property[] }>(`/properties?${queryParams.toString()}`);
      setProperties(data.results || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize with search params
  useEffect(() => {
    const params: SearchParams = {
      query: searchParams.get('query') || undefined,
      city: searchParams.get('city') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      bedrooms: searchParams.get('bedrooms') || undefined,
      bathrooms: searchParams.get('bathrooms') || undefined,
      lat: searchParams.get('lat') || undefined,
      lng: searchParams.get('lng') || undefined,
      distance: searchParams.get('distance') || '10',
    };

    // If we have lat/lng, set the center
    if (params.lat && params.lng) {
      setCenter({
        lat: parseFloat(params.lat),
        lng: parseFloat(params.lng),
      });
    }

    setCurrentParams(params);
    fetchProperties(params);
  }, [searchParams, fetchProperties]);

  const handleFilterChange = (filterParams: Partial<SearchParams>) => {
    const newParams = { ...currentParams, ...filterParams };

    // Remove undefined or empty values
    Object.keys(newParams).forEach((key) => {
      if (newParams[key as keyof SearchParams] === undefined || newParams[key as keyof SearchParams] === '') {
        delete newParams[key as keyof SearchParams];
      }
    });

    // Update URL with new params
    const queryString = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryString.append(key, value);
      }
    });

    router.push(`/maps?${queryString.toString()}`);
  };

  const handleMarkerClick = (property: Property) => {
    // This could open a side panel or navigate to property details
    router.push(`/properties/${property.id}`);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // Update the search params with the new location
      handleFilterChange({
        lat: lat.toString(),
        lng: lng.toString(),
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Browse Properties on Map</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="query"
              value={currentParams.query || ''}
              onChange={(e) => handleFilterChange({ query: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Search properties..."
            />
          </div>
          
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              value={currentParams.city || ''}
              onChange={(e) => handleFilterChange({ city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter city"
            />
          </div>
          
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
              Min Bedrooms
            </label>
            <select
              id="bedrooms"
              value={currentParams.bedrooms || ''}
              onChange={(e) => handleFilterChange({ bedrooms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
              Min Bathrooms
            </label>
            <select
              id="bathrooms"
              value={currentParams.bathrooms || ''}
              onChange={(e) => handleFilterChange({ bathrooms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              id="minPrice"
              value={currentParams.minPrice || ''}
              onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Min price"
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              id="maxPrice"
              value={currentParams.maxPrice || ''}
              onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Max price"
              min="0"
            />
          </div>
          
          <div>
            <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
              Search Distance (km)
            </label>
            <select
              id="distance"
              value={currentParams.distance || '10'}
              onChange={(e) => handleFilterChange({ distance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="1">1 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </select>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Map takes 2/3 of the screen on desktop */}
        <div className="w-full md:w-2/3 mb-6 md:mb-0">
          <PropertyMap
            apiKey={googleMapsApiKey}
            properties={properties}
            center={center || undefined}
            height="70vh"
            onMarkerClick={handleMarkerClick}
          />
          
          <div className="text-sm text-gray-500 mt-2">
            Click on the map to search in that area. Click on a marker to see property details.
          </div>
        </div>
        
        {/* Property list takes 1/3 of the screen on desktop */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {loading ? 'Loading properties...' : `${properties.length} Properties Found`}
              </h2>
            </div>
            
            <div className="h-[65vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : properties.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No properties found. Try adjusting your filters.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {properties.map(property => (
                    <div 
                      key={property.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMarkerClick(property)}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 h-20 w-20 bg-gray-200 rounded overflow-hidden">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <span className="text-xs text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{property.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{property.address}</p>
                          <div className="mt-2 flex items-center text-xs text-gray-500 space-x-2">
                            <span>{property.bedrooms} bd</span>
                            <span>•</span>
                            <span>{property.bathrooms} ba</span>
                          </div>
                          <p className="text-indigo-600 font-semibold mt-1">${property.price}/night</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
