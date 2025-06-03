import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchService } from '../elasticsearch/elasticsearch.service';
import { GeocodingService } from '../geocoding/geocoding.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly searchService: SearchService,
    private readonly geocodingService: GeocodingService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'AGENT', 'ADMIN')
  async create(@Request() req, @Body() createPropertyDto: CreatePropertyDto) {
    try {
      // Try to geocode the address
      if (createPropertyDto.address) {
        const fullAddress = `${createPropertyDto.address}, ${createPropertyDto.city}, ${createPropertyDto.country}`;
        const geocodingResult = await this.geocodingService.geocodeAddress(fullAddress);
        
        if (geocodingResult) {
          createPropertyDto.latitude = geocodingResult.latitude;
          createPropertyDto.longitude = geocodingResult.longitude;
        }
      }
      
      const property = await this.propertiesService.create(req.user.id, createPropertyDto);
      
      // Index the property in Elasticsearch
      await this.searchService.indexProperty(property);
      
      return property;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('bathrooms') bathrooms?: string,
    @Query('query') query?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('distance') distance?: string,
    @Query('sort') sort?: string,
  ) {
    try {
      // If we have search params, use Elasticsearch
      if (query || city || minPrice || maxPrice || bedrooms || bathrooms || (lat && lng)) {
        const filters = {
          city,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          minBedrooms: bedrooms ? parseInt(bedrooms, 10) : undefined,
          minBathrooms: bathrooms ? parseInt(bathrooms, 10) : undefined,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
        };
        
        let geoSearch = null;
        if (lat && lng) {
          geoSearch = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            distance: distance ? parseFloat(distance) : 10, // Default 10km
            sort: sort === 'distance' ? 'distance' : undefined,
          };
        }
        
        return this.searchService.searchProperties(query, filters, geoSearch);
      }
      
      // Otherwise, use regular database query
      return this.propertiesService.findAll({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        city,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'AGENT', 'ADMIN')
  async findMyProperties(@Request() req) {
    try {
      return this.propertiesService.findByOwnerId(req.user.id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('suggestions')
  async getSuggestions(@Query('query') query: string) {
    if (!query || query.length < 2) {
      return {
        titleSuggestions: [],
        citySuggestions: [],
        popularCities: [],
        popularCountries: [],
      };
    }
    
    return this.searchService.getPropertySuggestions(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const property = await this.propertiesService.findOne(id);
      if (!property) {
        throw new NotFoundException(`Property with ID ${id} not found`);
      }
      return property;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'AGENT', 'ADMIN')
  async update(
    @Request() req,
    @Param('id') id: string, 
    @Body() updatePropertyDto: UpdatePropertyDto
  ) {
    try {
      // Check if the user owns the property
      const property = await this.propertiesService.findOne(id);
      if (!property) {
        throw new NotFoundException(`Property with ID ${id} not found`);
      }
      
      if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new UnauthorizedException('You do not have permission to update this property');
      }
      
      // Try to geocode the address if it was updated
      if (updatePropertyDto.address && 
          (updatePropertyDto.address !== property.address || 
          updatePropertyDto.city !== property.city || 
          updatePropertyDto.country !== property.country)) {
        
        const fullAddress = `${updatePropertyDto.address || property.address}, ${updatePropertyDto.city || property.city}, ${updatePropertyDto.country || property.country}`;
        const geocodingResult = await this.geocodingService.geocodeAddress(fullAddress);
        
        if (geocodingResult) {
          updatePropertyDto.latitude = geocodingResult.latitude;
          updatePropertyDto.longitude = geocodingResult.longitude;
        }
      }
      
      const updatedProperty = await this.propertiesService.update(id, updatePropertyDto);
      
      // Update the property in Elasticsearch
      await this.searchService.updateProperty(id, updatedProperty);
      
      return updatedProperty;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'AGENT', 'ADMIN')
  async remove(@Request() req, @Param('id') id: string) {
    try {
      // Check if the user owns the property
      const property = await this.propertiesService.findOne(id);
      if (!property) {
        throw new NotFoundException(`Property with ID ${id} not found`);
      }
      
      if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new UnauthorizedException('You do not have permission to delete this property');
      }
      
      await this.propertiesService.remove(id);
      
      // Delete the property from Elasticsearch
      await this.searchService.deleteProperty(id);
      
      return { message: 'Property deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
