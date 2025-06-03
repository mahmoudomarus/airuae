import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req) {
    if (req.user.role === 'ADMIN') {
      return this.bookingsService.findAll({});
    } else {
      return this.bookingsService.findUserBookings(req.user.id);
    }
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  async findMyBookings(@Request() req) {
    return this.bookingsService.findUserBookings(req.user.id);
  }

  @Get('property/:propertyId')
  @UseGuards(JwtAuthGuard)
  async findPropertyBookings(@Request() req, @Param('propertyId') propertyId: string) {
    // Need to check if the user owns the property or is an admin
    const bookings = await this.bookingsService.findAll({ propertyId });
    
    // We need to check the first booking to verify ownership
    if (bookings.length > 0) {
      const property = bookings[0].property;
      if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenException('You do not have permission to view these bookings');
      }
    }
    
    return bookings;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Request() req, @Param('id') id: string) {
    const booking = await this.bookingsService.findOne(id);
    
    // Only allow the booking user, property owner, or admin to view the booking
    if (
      booking.userId !== req.user.id && 
      booking.property.owner.id !== req.user.id && 
      req.user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }
    
    return booking;
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(
      id,
      req.user.id,
      req.user.role,
      updateBookingStatusDto,
    );
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Request() req, @Param('id') id: string) {
    return this.bookingsService.cancel(id, req.user.id, req.user.role);
  }
}
