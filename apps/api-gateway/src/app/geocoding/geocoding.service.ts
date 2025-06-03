import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Status } from '@googlemaps/google-maps-services-js';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key is not set. Geocoding will not work.');
    }
  }

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      this.logger.warn('Geocoding request made but API key is not set');
      return null;
    }

    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status === Status.OK && response.data.results.length > 0) {
        const result = response.data.results[0];
        const { lat, lng } = result.geometry.location;

        return {
          latitude: lat,
          longitude: lng,
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
        };
      }

      this.logger.warn(`Geocoding failed with status: ${response.data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding address: ${error.message}`);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) {
      this.logger.warn('Reverse geocoding request made but API key is not set');
      return null;
    }

    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
      });

      if (response.data.status === Status.OK && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      this.logger.warn(`Reverse geocoding failed with status: ${response.data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Error reverse geocoding: ${error.message}`);
      return null;
    }
  }

  async getPlacePredictions(input: string, sessionToken?: string): Promise<any[]> {
    if (!this.apiKey) {
      this.logger.warn('Place predictions request made but API key is not set');
      return [];
    }

    try {
      const response = await this.client.placeAutocomplete({
        params: {
          input,
          key: this.apiKey,
          sessiontoken: sessionToken,
          types: 'geocode',
        },
      });

      if (response.data.status === Status.OK) {
        return response.data.predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
        }));
      }

      this.logger.warn(`Place predictions failed with status: ${response.data.status}`);
      return [];
    } catch (error) {
      this.logger.error(`Error getting place predictions: ${error.message}`);
      return [];
    }
  }

  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<any | null> {
    if (!this.apiKey) {
      this.logger.warn('Place details request made but API key is not set');
      return null;
    }

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          sessiontoken: sessionToken,
          fields: ['geometry', 'formatted_address', 'address_component'],
        },
      });

      if (response.data.status === Status.OK) {
        const { result } = response.data;
        const { lat, lng } = result.geometry.location;

        return {
          latitude: lat,
          longitude: lng,
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
        };
      }

      this.logger.warn(`Place details failed with status: ${response.data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting place details: ${error.message}`);
      return null;
    }
  }
}
