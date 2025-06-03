import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
    // Verify the property exists and is available
    const property = await this.prisma.property.findUnique({
      where: { id: createBookingDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (!property.available) {
      throw new BadRequestException('Property is not available for booking');
    }

    // Verify dates are valid
    const startDate = new Date(createBookingDto.startDate);
    const endDate = new Date(createBookingDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for conflicts with existing bookings
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: createBookingDto.propertyId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            // New booking starts during an existing booking
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      throw new BadRequestException('The property is already booked for the selected dates');
    }

    // Create the booking
    return this.prisma.booking.create({
      data: {
        startDate,
        endDate,
        totalPrice: createBookingDto.totalPrice,
        nights: createBookingDto.nights,
        status: BookingStatus.PENDING,
        user: {
          connect: { id: userId },
        },
        property: {
          connect: { id: createBookingDto.propertyId },
        },
      },
    });
  }

  async findAll(params: {
    userId?: string;
    propertyId?: string;
    status?: BookingStatus;
  }): Promise<Booking[]> {
    const { userId, propertyId, status } = params;
    const where: Prisma.BookingWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        property: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async updateStatus(
    id: string,
    userId: string,
    userRole: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    // Find the booking
    const booking = await this.findOne(id);

    // Check if the user is authorized to update the booking
    const isOwner = booking.property.owner.id === userId;
    const isBooker = booking.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isBooker && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    // Property owners and admins can update to any status
    // Users can only cancel their own bookings
    if (isBooker && !isOwner && !isAdmin && updateBookingStatusDto.status !== BookingStatus.CANCELLED) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    // Update the booking status
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: updateBookingStatusDto.status,
      },
      include: {
        property: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async cancel(id: string, userId: string, userRole: string): Promise<Booking> {
    return this.updateStatus(
      id,
      userId,
      userRole,
      { status: BookingStatus.CANCELLED },
    );
  }

  async findUserBookings(userId: string): Promise<Booking[]> {
    return this.findAll({ userId });
  }

  async findPropertyBookings(propertyId: string): Promise<Booking[]> {
    return this.findAll({ propertyId });
  }
}
