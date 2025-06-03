import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding database...');
  
  // Clear existing data
  await prisma.booking.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@airuae.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  
  const landlord = await prisma.user.create({
    data: {
      email: 'landlord@airuae.com',
      passwordHash: hashedPassword,
      firstName: 'Landlord',
      lastName: 'User',
      role: 'LANDLORD',
      isVerified: true,
    },
  });
  
  const agent = await prisma.user.create({
    data: {
      email: 'agent@airuae.com',
      passwordHash: hashedPassword,
      firstName: 'Agent',
      lastName: 'User',
      role: 'AGENT',
      isVerified: true,
    },
  });
  
  const user = await prisma.user.create({
    data: {
      email: 'user@airuae.com',
      passwordHash: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
      isVerified: true,
    },
  });
  
  console.log('Created users:', { admin, landlord, agent, user });
  
  // Create sample properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Luxury Apartment in Dubai Marina',
      description: 'Beautiful 2-bedroom apartment with stunning sea views in the heart of Dubai Marina.',
      address: 'Dubai Marina, Dubai',
      city: 'Dubai',
      country: 'UAE',
      zipCode: '00000',
      price: 250,
      bedrooms: 2,
      bathrooms: 2,
      size: 120,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
      ],
      amenities: ['WiFi', 'Pool', 'Gym', 'Parking'],
      available: true,
      owner: {
        connect: {
          id: landlord.id,
        },
      },
    },
  });
  
  const property2 = await prisma.property.create({
    data: {
      title: 'Modern Villa in Palm Jumeirah',
      description: 'Spacious 4-bedroom villa with private pool and direct beach access in Palm Jumeirah.',
      address: 'Palm Jumeirah, Dubai',
      city: 'Dubai',
      country: 'UAE',
      zipCode: '00000',
      price: 1000,
      bedrooms: 4,
      bathrooms: 5,
      size: 350,
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
      ],
      amenities: ['WiFi', 'Pool', 'Garden', 'Parking', 'Beach Access'],
      available: true,
      owner: {
        connect: {
          id: landlord.id,
        },
      },
    },
  });
  
  const property3 = await prisma.property.create({
    data: {
      title: 'Cozy Studio in Downtown Dubai',
      description: 'Modern studio apartment with Burj Khalifa views in Downtown Dubai.',
      address: 'Downtown Dubai, Dubai',
      city: 'Dubai',
      country: 'UAE',
      zipCode: '00000',
      price: 150,
      bedrooms: 0,
      bathrooms: 1,
      size: 50,
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
      ],
      amenities: ['WiFi', 'Gym', 'Parking'],
      available: true,
      owner: {
        connect: {
          id: agent.id,
        },
      },
    },
  });
  
  console.log('Created properties:', { property1, property2, property3 });
  
  // Create sample bookings
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // 7 days from now
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 5); // 5 days after start date
  
  const booking = await prisma.booking.create({
    data: {
      startDate,
      endDate,
      totalPrice: 750, // 5 days * 150 per night
      status: 'CONFIRMED',
      nights: 5,
      user: {
        connect: {
          id: user.id,
        },
      },
      property: {
        connect: {
          id: property3.id,
        },
      },
    },
  });
  
  console.log('Created booking:', booking);
  
  console.log('Seeding finished!');
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
