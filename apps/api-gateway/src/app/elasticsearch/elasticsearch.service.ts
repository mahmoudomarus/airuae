import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    try {
      // Check if Elasticsearch is running
      const health = await this.elasticsearchService.cluster.health();
      this.logger.log(`Elasticsearch health: ${health.status}`);
      
      // Create the properties index if it doesn't exist
      await this.createPropertyIndex();
    } catch (error) {
      this.logger.error('Failed to connect to Elasticsearch', error);
    }
  }

  async createPropertyIndex() {
    const indexExists = await this.elasticsearchService.indices.exists({
      index: 'properties',
    });
    
    if (!indexExists) {
      await this.elasticsearchService.indices.create({
        index: 'properties',
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'text' },
              description: { type: 'text' },
              address: { type: 'text' },
              city: { type: 'keyword' },
              country: { type: 'keyword' },
              price: { type: 'float' },
              bedrooms: { type: 'integer' },
              bathrooms: { type: 'integer' },
              size: { type: 'float' },
              available: { type: 'boolean' },
              amenities: { type: 'keyword' },
              location: { type: 'geo_point' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        },
      });
      
      this.logger.log('Created properties index');
    }
  }

  async indexProperty(property: any) {
    try {
      await this.elasticsearchService.index({
        index: 'properties',
        id: property.id,
        body: {
          ...property,
          // If location is provided in lat/lng format, use it
          ...(property.latitude && property.longitude
            ? { location: { lat: property.latitude, lon: property.longitude } }
            : {}),
        },
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to index property: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateProperty(propertyId: string, property: any) {
    try {
      await this.elasticsearchService.update({
        index: 'properties',
        id: propertyId,
        body: {
          doc: {
            ...property,
            // If location is provided in lat/lng format, use it
            ...(property.latitude && property.longitude
              ? { location: { lat: property.latitude, lon: property.longitude } }
              : {}),
          },
        },
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update property: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async deleteProperty(propertyId: string) {
    try {
      await this.elasticsearchService.delete({
        index: 'properties',
        id: propertyId,
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete property: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async searchProperties(query: string, filters: any = {}, geoSearch: any = null) {
    const { 
      minPrice, maxPrice, 
      minBedrooms, minBathrooms, 
      city, country,
      amenities,
      page = 1, limit = 10 
    } = filters;
    
    const from = (page - 1) * limit;

    // Build the search body
    const must = [];
    const filter = [];
    
    // Text search
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'description', 'address^2', 'city^2', 'country'],
          fuzziness: 'AUTO',
        },
      });
    }
    
    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      const range = { price: {} };
      if (minPrice !== undefined) range.price.gte = minPrice;
      if (maxPrice !== undefined) range.price.lte = maxPrice;
      filter.push({ range });
    }
    
    // Bedrooms & bathrooms
    if (minBedrooms !== undefined) {
      filter.push({ range: { bedrooms: { gte: minBedrooms } } });
    }
    
    if (minBathrooms !== undefined) {
      filter.push({ range: { bathrooms: { gte: minBathrooms } } });
    }
    
    // City & country
    if (city) {
      filter.push({ term: { city } });
    }
    
    if (country) {
      filter.push({ term: { country } });
    }
    
    // Amenities
    if (amenities && amenities.length > 0) {
      filter.push({
        terms: {
          amenities: Array.isArray(amenities) ? amenities : [amenities],
        },
      });
    }
    
    // Available properties only
    filter.push({ term: { available: true } });
    
    // Geo search
    if (geoSearch && geoSearch.lat && geoSearch.lng && geoSearch.distance) {
      filter.push({
        geo_distance: {
          distance: `${geoSearch.distance}km`,
          location: {
            lat: geoSearch.lat,
            lon: geoSearch.lng,
          },
        },
      });
    }
    
    const searchBody = {
      from,
      size: limit,
      query: {
        bool: {
          must,
          filter,
        },
      },
      sort: [
        // Default sort by score
        { _score: { order: 'desc' } },
        // Then by creation date (newest first)
        { createdAt: { order: 'desc' } },
      ],
    };
    
    // Add geo-distance sorting if requested
    if (geoSearch && geoSearch.lat && geoSearch.lng && geoSearch.sort === 'distance') {
      searchBody.sort.unshift({
        _geo_distance: {
          location: {
            lat: geoSearch.lat,
            lon: geoSearch.lng,
          },
          order: 'asc',
          unit: 'km',
        },
      });
    }
    
    try {
      const { body } = await this.elasticsearchService.search({
        index: 'properties',
        body: searchBody,
      });
      
      // Format the response
      const total = body.hits.total.value;
      const hits = body.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score,
        ...(geoSearch && geoSearch.lat && geoSearch.lng && hit.sort?.[0]
          ? { distance: hit.sort[0] }
          : {}),
      }));
      
      return {
        total,
        results: hits,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Search error: ${error.message}`);
      throw error;
    }
  }

  async getPropertySuggestions(query: string) {
    try {
      const { body } = await this.elasticsearchService.search({
        index: 'properties',
        body: {
          size: 0,
          suggest: {
            text: query,
            title_suggestions: {
              term: {
                field: 'title',
                suggest_mode: 'popular',
              },
            },
            city_suggestions: {
              term: {
                field: 'city',
                suggest_mode: 'popular',
              },
            },
          },
          aggs: {
            cities: {
              terms: {
                field: 'city',
                size: 5,
              },
            },
            countries: {
              terms: {
                field: 'country',
                size: 5,
              },
            },
          },
        },
      });
      
      const titleSuggestions = body.suggest.title_suggestions
        .flatMap(suggestion => suggestion.options)
        .map(option => option.text);
        
      const citySuggestions = body.suggest.city_suggestions
        .flatMap(suggestion => suggestion.options)
        .map(option => option.text);
        
      const popularCities = body.aggregations.cities.buckets.map(bucket => bucket.key);
      const popularCountries = body.aggregations.countries.buckets.map(bucket => bucket.key);
      
      return {
        titleSuggestions: [...new Set(titleSuggestions)],
        citySuggestions: [...new Set(citySuggestions)],
        popularCities,
        popularCountries,
      };
    } catch (error) {
      this.logger.error(`Suggestion error: ${error.message}`);
      throw error;
    }
  }
  
  async syncAllProperties(properties: any[]) {
    const operations = properties.flatMap(property => [
      { index: { _index: 'properties', _id: property.id } },
      {
        ...property,
        ...(property.latitude && property.longitude
          ? { location: { lat: property.latitude, lon: property.longitude } }
          : {}),
      },
    ]);
    
    if (operations.length === 0) {
      return { success: true, indexed: 0 };
    }
    
    try {
      const { body } = await this.elasticsearchService.bulk({
        refresh: true,
        body: operations,
      });
      
      if (body.errors) {
        const errorItems = body.items.filter(item => item.index.error);
        this.logger.error(`Bulk indexing had errors: ${JSON.stringify(errorItems)}`);
        return { 
          success: false, 
          indexed: body.items.length - errorItems.length,
          errors: errorItems.map(item => item.index.error),
        };
      }
      
      return { success: true, indexed: body.items.length / 2 };
    } catch (error) {
      this.logger.error(`Bulk indexing error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
