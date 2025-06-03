import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Headers,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { BookingsService } from '../bookings/bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly bookingsService: BookingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Request() req,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    try {
      // Find the booking
      const booking = await this.prisma.booking.findUnique({
        where: { id: createPaymentIntentDto.bookingId },
        include: { property: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Check if the user owns the booking
      if (booking.userId !== req.user.id) {
        throw new UnauthorizedException('You do not have permission to pay for this booking');
      }

      // Check if the booking is already paid
      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException('This booking is already processed');
      }

      // Use the booking amount or the provided amount
      const amount = createPaymentIntentDto.amount || booking.totalPrice;
      const currency = createPaymentIntentDto.currency || 'usd';

      // Create metadata for the payment intent
      const metadata = {
        bookingId: booking.id,
        propertyId: booking.propertyId,
        userId: req.user.id,
        propertyTitle: booking.property.title,
      };

      // Create the payment intent
      const paymentIntent = await this.stripeService.createPaymentIntent(
        amount,
        currency,
        metadata,
      );

      return paymentIntent;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Request() req,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    try {
      // Find the booking
      const booking = await this.prisma.booking.findUnique({
        where: { id: createCheckoutSessionDto.bookingId },
        include: { property: true, user: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Check if the user owns the booking
      if (booking.userId !== req.user.id) {
        throw new UnauthorizedException('You do not have permission to pay for this booking');
      }

      // Check if the booking is already paid
      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException('This booking is already processed');
      }

      // Use the booking amount or the provided amount
      const amount = createCheckoutSessionDto.amount || booking.totalPrice;
      const currency = createCheckoutSessionDto.currency || 'usd';

      // Create a checkout session
      const session = await this.stripeService.createCheckoutSession(
        booking.id,
        booking.property.title,
        amount,
        currency,
        createCheckoutSessionDto.customerId,
        createCheckoutSessionDto.customerEmail || booking.user.email,
        createCheckoutSessionDto.successUrl,
        createCheckoutSessionDto.cancelUrl,
      );

      return session;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to create checkout session: ${error.message}`);
    }
  }

  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getCheckoutSession(@Param('sessionId') sessionId: string) {
    try {
      const session = await this.stripeService.retrieveCheckoutSession(sessionId);
      return session;
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve checkout session: ${error.message}`);
    }
  }

  @Post('webhooks')
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      const event = await this.stripeService.handleWebhookEvent(
        req.rawBody,
        signature,
      );

      // Handle the webhook event based on its type
      if (event && event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const bookingId = session.metadata.bookingId;
        
        // Update the booking status to confirmed
        if (bookingId) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.CONFIRMED },
          });
        }
      } else if (event && event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const bookingId = paymentIntent.metadata.bookingId;
        
        // Update the booking status to confirmed
        if (bookingId) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.CONFIRMED },
          });
        }
      }

      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  @Post('refunds/:bookingId')
  @UseGuards(JwtAuthGuard)
  async createRefund(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Body() data: { amount?: number },
  ) {
    try {
      // Find the booking
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { property: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Check if the user owns the booking or the property
      const isBookingOwner = booking.userId === req.user.id;
      const isPropertyOwner = booking.property.ownerId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isBookingOwner && !isPropertyOwner && !isAdmin) {
        throw new UnauthorizedException('You do not have permission to refund this booking');
      }

      // Check if the booking is confirmed (can only refund confirmed bookings)
      if (booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException('Can only refund confirmed bookings');
      }

      // TODO: Retrieve the payment intent ID from the booking
      // For now, we'll assume it's stored in a payment relation
      const payment = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { paymentIntentId: true },
      });

      if (!payment || !payment.paymentIntentId) {
        throw new BadRequestException('No payment found for this booking');
      }

      // Create the refund
      const refund = await this.stripeService.createRefund(
        payment.paymentIntentId,
        data.amount,
      );

      // Update the booking status to cancelled
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      return refund;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to create refund: ${error.message}`);
    }
  }
}
