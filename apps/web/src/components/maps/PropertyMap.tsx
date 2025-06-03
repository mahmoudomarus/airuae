'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  images: string[];
  latitude?: number;
  longitude?: number;
}

interface PropertyMapProps {
  apiKey: string;
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  width?: string;
  showInfoWindow?: boolean;
  onMarkerClick?: (property: Property) => void;
  onLoad?: () => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 25.276987, // Dubai
  lng: 55.296249,
};

export default function PropertyMap({
  apiKey,
  properties,
  center = defaultCenter,
  zoom = 12,
  height = '500px',
  width = '100%',
  showInfoWindow = true,
  onMarkerClick,
  onLoad,
}: PropertyMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Filter out properties without coordinates
  const validProperties = properties.filter(p => p.latitude && p.longitude);

  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMap(map);
    if (onLoad) onLoad();
  }, [onLoad]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
  }, []);

  const handleMarkerClick = (property: Property) => {
    setSelectedProperty(property);
    if (onMarkerClick) onMarkerClick(property);
  };

  // Auto-adjust bounds to fit all markers
  useEffect(() => {
    if (map && validProperties.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      validProperties.forEach(property => {
        if (property.latitude && property.longitude) {
          bounds.extend({
            lat: property.latitude,
            lng: property.longitude,
          });
        }
      });
      
      // Only adjust bounds if we have more than one marker
      // otherwise just center on the single property
      if (validProperties.length > 1) {
        map.fitBounds(bounds);
        
        // Add some padding to the bounds
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          map.setZoom(Math.min(15, map.getZoom() || 15));
        });
        
        return () => {
          google.maps.event.removeListener(listener);
        };
      }
    }
  }, [map, validProperties]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height, width }}>
        <p className="text-red-500">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height, width }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div style={{ height, width }} className="rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={validProperties.length === 0 ? center : undefined}
        zoom={zoom}
        onLoad={onMapLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {validProperties.map(property => (
          <Marker
            key={property.id}
            position={{
              lat: property.latitude!,
              lng: property.longitude!,
            }}
            onClick={() => handleMarkerClick(property)}
            icon={{
              url: '/marker-icon.png',
              scaledSize: new window.google.maps.Size(32, 32),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(16, 32),
            }}
          />
        ))}

        {showInfoWindow && selectedProperty && (
          <InfoWindow
            position={{
              lat: selectedProperty.latitude!,
              lng: selectedProperty.longitude!,
            }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="max-w-xs">
              <div className="mb-2">
                {selectedProperty.images && selectedProperty.images.length > 0 ? (
                  <img
                    src={selectedProperty.images[0]}
                    alt={selectedProperty.title}
                    className="w-full h-32 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm">{selectedProperty.title}</h3>
              <p className="text-gray-600 text-xs">{selectedProperty.address}</p>
              <p className="text-indigo-600 font-semibold mt-1">${selectedProperty.price}/night</p>
              <Link
                href={`/properties/${selectedProperty.id}`}
                className="text-xs text-indigo-600 hover:text-indigo-800 mt-2 block"
              >
                View details
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
