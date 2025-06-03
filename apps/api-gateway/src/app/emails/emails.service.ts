import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User, Booking, Property } from '@prisma/client';

type BookingWithRelations = Booking & {
  user: User;
  property: Property;
};

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly appUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to AirUAE',
        template: 'welcome',
        context: {
          user: {
            firstName: user.firstName || 'there',
            email: user.email,
          },
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${user.email}: ${error.message}`);
    }
  }

  /**
   * Send an email verification link
   */
  async sendVerificationEmail(user: User, token: string): Promise<void> {
    try {
      const verificationUrl = `${this.appUrl}/auth/verify?token=${token}`;

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Verify your email address',
        template: 'verification',
        context: {
          user: {
            firstName: user.firstName || 'there',
            email: user.email,
          },
          verificationUrl,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${user.email}: ${error.message}`);
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    try {
      const resetUrl = `${this.appUrl}/auth/reset-password?token=${token}`;

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reset your password',
        template: 'password-reset',
        context: {
          user: {
            firstName: user.firstName || 'there',
            email: user.email,
          },
          resetUrl,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${user.email}: ${error.message}`);
    }
  }

  /**
   * Send a booking confirmation email to the guest
   */
  async sendBookingConfirmationToGuest(booking: BookingWithRelations): Promise<void> {
    try {
      const bookingUrl = `${this.appUrl}/bookings/${booking.id}`;
      const { user, property } = booking;

      await this.mailerService.sendMail({
        to: user.email,
        subject: `Booking Confirmation - ${property.title}`,
        template: 'booking-confirmation-guest',
        context: {
          user: {
            firstName: user.firstName || 'there',
            email: user.email,
          },
          booking: {
            ...booking,
            startDate: new Date(booking.startDate).toLocaleDateString(),
            endDate: new Date(booking.endDate).toLocaleDateString(),
            formattedPrice: booking.totalPrice.toFixed(2),
          },
          property,
          bookingUrl,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Booking confirmation email sent to guest ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email to guest: ${error.message}`);
    }
  }

  /**
   * Send a booking notification to the property owner
   */
  async sendBookingNotificationToHost(booking: BookingWithRelations, host: User): Promise<void> {
    try {
      const bookingManageUrl = `${this.appUrl}/dashboard/bookings/${booking.id}`;
      const { user, property } = booking;

      await this.mailerService.sendMail({
        to: host.email,
        subject: `New Booking - ${property.title}`,
        template: 'booking-notification-host',
        context: {
          host: {
            firstName: host.firstName || 'there',
            email: host.email,
          },
          guest: {
            firstName: user.firstName || 'Guest',
            lastName: user.lastName || '',
            email: user.email,
          },
          booking: {
            ...booking,
            startDate: new Date(booking.startDate).toLocaleDateString(),
            endDate: new Date(booking.endDate).toLocaleDateString(),
            formattedPrice: booking.totalPrice.toFixed(2),
          },
          property,
          bookingManageUrl,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Booking notification email sent to host ${host.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking notification email to host: ${error.message}`);
    }
  }

  /**
   * Send a booking cancellation email to the guest
   */
  async sendBookingCancellationToGuest(booking: BookingWithRelations): Promise<void> {
    try {
      const { user, property } = booking;

      await this.mailerService.sendMail({
        to: user.email,
        subject: `Booking Cancelled - ${property.title}`,
        template: 'booking-cancellation-guest',
        context: {
          user: {
            firstName: user.firstName || 'there',
            email: user.email,
          },
          booking: {
            ...booking,
            startDate: new Date(booking.startDate).toLocaleDateString(),
            endDate: new Date(booking.endDate).toLocaleDateString(),
            formattedPrice: booking.totalPrice.toFixed(2),
          },
          property,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Booking cancellation email sent to guest ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking cancellation email to guest: ${error.message}`);
    }
  }

  /**
   * Send a booking cancellation notification to the property owner
   */
  async sendBookingCancellationToHost(booking: BookingWithRelations, host: User): Promise<void> {
    try {
      const { user, property } = booking;

      await this.mailerService.sendMail({
        to: host.email,
        subject: `Booking Cancelled - ${property.title}`,
        template: 'booking-cancellation-host',
        context: {
          host: {
            firstName: host.firstName || 'there',
            email: host.email,
          },
          guest: {
            firstName: user.firstName || 'Guest',
            lastName: user.lastName || '',
            email: user.email,
          },
          booking: {
            ...booking,
            startDate: new Date(booking.startDate).toLocaleDateString(),
            endDate: new Date(booking.endDate).toLocaleDateString(),
            formattedPrice: booking.totalPrice.toFixed(2),
          },
          property,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Booking cancellation email sent to host ${host.email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking cancellation email to host: ${error.message}`);
    }
  }

  /**
   * Send a payment confirmation email
   */
  async sendPaymentConfirmationEmail(booking: BookingWithRelations): Promise<void> {
    try {
      const bookingUrl = `${this.appUrl}/bookings/${booking.id}`;
      const { user, property } = booking;

      await this.mailerService.sendMail({
        to: user.email,
        subject: `Payment Confirmation - ${property.title}`,
        template: 'payment-confirmation',
        context: {
          user: {
            firstName: user.firstName || 'there',
            email: user.email,
          },
          booking: {
            ...booking,
            startDate: new Date(booking.startDate).toLocaleDateString(),
            endDate: new Date(booking.endDate).toLocaleDateString(),
            formattedPrice: booking.totalPrice.toFixed(2),
          },
          property,
          bookingUrl,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Payment confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation email: ${error.message}`);
    }
  }

  /**
   * Send a viewing request confirmation to a guest (for long-term rentals)
   */
  async sendViewingRequestConfirmation(
    user: User, 
    property: Property,
    viewingDate: Date,
    viewingId: string,
  ): Promise<void> {
    try {
      const viewingUrl = `${this.appUrl}/viewings/${viewingId}`;

      await this.mailerService.sendMail({
        to: user.email,
        subject: `Viewing Request Confirmed - ${property.title}`,
        template: 'viewing-request-confirmation',
        context: {
          user: {
            firstName: user.firstName || 'there',
            email: user.email,
          },
          property,
          viewingDate: viewingDate.toLocaleDateString(),
          viewingTime: viewingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          viewingUrl,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Viewing request confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send viewing request confirmation email: ${error.message}`);
    }
  }

  /**
   * Send a viewing request notification to a property owner/agent
   */
  async sendViewingRequestToHost(
    viewer: User,
    host: User,
    property: Property,
    viewingDate: Date,
    viewingId: string,
  ): Promise<void> {
    try {
      const viewingManageUrl = `${this.appUrl}/dashboard/viewings/${viewingId}`;

      await this.mailerService.sendMail({
        to: host.email,
        subject: `New Viewing Request - ${property.title}`,
        template: 'viewing-request-host',
        context: {
          host: {
            firstName: host.firstName || 'there',
            email: host.email,
          },
          viewer: {
            firstName: viewer.firstName || 'Viewer',
            lastName: viewer.lastName || '',
            email: viewer.email,
            phone: viewer.phone || 'Not provided',
          },
          property,
          viewingDate: viewingDate.toLocaleDateString(),
          viewingTime: viewingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          viewingManageUrl,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Viewing request notification email sent to host ${host.email}`);
    } catch (error) {
      this.logger.error(`Failed to send viewing request notification email to host: ${error.message}`);
    }
  }

  /**
   * Send a generic notification email
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          ...context,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Notification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${to}: ${error.message}`);
    }
  }
}
