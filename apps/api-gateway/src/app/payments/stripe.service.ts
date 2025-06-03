import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2023-10-16',
      }
    );
  }

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata: Record<string, string> = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        payment_method_types: ['card'],
      });

      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error confirming payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(amount && { amount: Math.round(amount * 100) }), // Convert to cents if provided
      });
      return refund;
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a Stripe Checkout session for a booking
   */
  async createCheckoutSession(
    bookingId: string,
    propertyTitle: string,
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    customerEmail?: string,
    successUrl?: string,
    cancelUrl?: string,
  ) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `Booking for ${propertyTitle}`,
                description: `Booking ID: ${bookingId}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${this.configService.get<string>('FRONTEND_URL')}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${this.configService.get<string>('FRONTEND_URL')}/bookings/cancel?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          bookingId,
        },
        ...(customerId && { customer: customerId }),
        ...(customerEmail && { customer_email: customerEmail }),
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Error creating checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieve a Checkout session
   */
  async retrieveCheckoutSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      this.logger.error(`Error retrieving checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a Stripe Customer
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
      return customer;
    } catch (error) {
      this.logger.error(`Error creating customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      this.logger.warn('Stripe webhook secret is not set');
      return null;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      this.logger.log(`Webhook received: ${event.type}`);
      
      // Process different types of events
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(event.data.object);
        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(event.data.object);
        case 'checkout.session.completed':
          return this.handleCheckoutSessionCompleted(event.data.object);
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return event;
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
    // We'll handle this in the payment controller
    return paymentIntent;
  }

  /**
   * Handle failed payment intent
   */
  private handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.error(`PaymentIntent failed: ${paymentIntent.id}`);
    // We'll handle this in the payment controller
    return paymentIntent;
  }

  /**
   * Handle completed checkout session
   */
  private handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout session completed: ${session.id}`);
    // We'll handle this in the payment controller
    return session;
  }
}
