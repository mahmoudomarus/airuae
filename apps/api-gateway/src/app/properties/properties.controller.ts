import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll() {
    return this.propertiesService.findAll({
      where: { available: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('search')
  async search(@Query() searchDto: SearchPropertyDto) {
    return this.propertiesService.search(searchDto);
  }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard)
  async findMyProperties(@Request() req) {
    return this.propertiesService.findByOwner(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createPropertyDto: CreatePropertyDto) {
    // Only allow landlords and admins to create properties
    if (req.user.role !== 'LANDLORD' && req.user.role !== 'ADMIN' && req.user.role !== 'AGENT') {
      throw new ForbiddenException('Only landlords, agents, and admins can create properties');
    }
    
    return this.propertiesService.create({
      ...createPropertyDto,
      ownerId: req.user.id,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    // First, check if the property exists and belongs to the user
    const property = await this.propertiesService.findOne(id);
    
    // Only allow the owner or admin to update properties
    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have permission to update this property');
    }
    
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req, @Param('id') id: string) {
    // First, check if the property exists and belongs to the user
    const property = await this.propertiesService.findOne(id);
    
    // Only allow the owner or admin to delete properties
    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have permission to delete this property');
    }
    
    return this.propertiesService.delete(id);
  }
}
