'use client';

import { useState, FormEvent, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface PaymentFormProps {
  bookingId: string;
  totalAmount: number;
  propertyTitle: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export default function PaymentForm({
  bookingId,
  totalAmount,
  propertyTitle,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [succeeded, setSucceeded] = useState(false);

  // Fetch the client secret when the component mounts
  useEffect(() => {
    const getClientSecret = async () => {
      try {
        const response = await api.post('/payments/payment-intent', { bookingId });
        setClientSecret(response.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Could not initialize payment. Please try again.');
        if (onError) onError('Could not initialize payment');
      }
    };

    if (bookingId && totalAmount > 0) {
      getClientSecret();
    }
  }, [bookingId, totalAmount]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card details');
      return;
    }

    if (!clientSecret) {
      setError('Payment not initialized properly');
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Guest User', // Ideally, this would come from user data
        },
      },
    });

    if (paymentError) {
      setError(paymentError.message || 'An error occurred during payment');
      if (onError) onError(paymentError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      setSucceeded(true);
      setProcessing(false);
      if (onSuccess) onSuccess(paymentIntent.id);
      
      // Redirect to success page
      router.push(`/bookings/success?booking_id=${bookingId}`);
    } else {
      setError('Payment processing error. Please try again.');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
        <p className="text-gray-600 mb-4">
          Complete your booking for <span className="font-medium">{propertyTitle}</span> by entering
          your payment information below.
        </p>
        <div className="border border-gray-300 rounded-md p-4">
          <CardElement
            options={cardElementOptions}
            onChange={(e) => {
              setCardComplete(e.complete);
              setError(e.error ? e.error.message : null);
            }}
          />
        </div>
        {error && (
          <div className="mt-2 text-red-600 text-sm">
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between font-medium">
          <span>Total amount:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !cardComplete || succeeded}
        className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-medium ${
          (!stripe || processing || !cardComplete || succeeded) &&
          'opacity-50 cursor-not-allowed'
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : succeeded ? (
          'Payment Successful!'
        ) : (
          `Pay $${totalAmount.toFixed(2)}`
        )}
      </button>
      
      <p className="text-xs text-gray-500 text-center mt-4">
        Your card will be charged immediately. You can cancel your booking up to 48 hours before check-in for a full refund.
      </p>
    </form>
  );
}
