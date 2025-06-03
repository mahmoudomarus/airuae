import { Injectable, NotFoundException } from '@nestjs/common';
import { Property, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PropertyWhereUniqueInput;
    where?: Prisma.PropertyWhereInput;
    orderBy?: Prisma.PropertyOrderByWithRelationInput;
  }): Promise<Property[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.property.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Property | null> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async search(params: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    skip?: number;
    take?: number;
  }): Promise<Property[]> {
    const { city, minPrice, maxPrice, bedrooms, bathrooms, amenities, skip, take } = params;

    const where: Prisma.PropertyWhereInput = {
      available: true,
    };

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (minPrice !== undefined) {
      where.price = {
        ...where.price,
        gte: minPrice,
      };
    }

    if (maxPrice !== undefined) {
      where.price = {
        ...where.price,
        lte: maxPrice,
      };
    }

    if (bedrooms !== undefined) {
      where.bedrooms = {
        gte: bedrooms,
      };
    }

    if (bathrooms !== undefined) {
      where.bathrooms = {
        gte: bathrooms,
      };
    }

    if (amenities && amenities.length > 0) {
      where.amenities = {
        hasSome: amenities,
      };
    }

    return this.prisma.property.findMany({
      where,
      skip: skip || 0,
      take: take || 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async create(data: {
    title: string;
    description: string;
    address: string;
    city: string;
    country: string;
    zipCode?: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    size?: number;
    images: string[];
    amenities: string[];
    ownerId: string;
  }): Promise<Property> {
    return this.prisma.property.create({
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.PropertyUpdateInput,
  ): Promise<Property> {
    await this.findOne(id); // Check if property exists

    return this.prisma.property.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<Property> {
    await this.findOne(id); // Check if property exists

    return this.prisma.property.delete({
      where: { id },
    });
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: { ownerId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
