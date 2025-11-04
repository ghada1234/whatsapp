const Razorpay = require('razorpay');
const Stripe = require('stripe');
const logger = require('../utils/logger');
require('dotenv').config();

class PaymentService {
  constructor() {
    // Initialize Razorpay
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    }

    // Initialize Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  /**
   * Create Razorpay payment link
   */
  async createRazorpayLink(customerId, amount, description, productCategory) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not configured');
      }

      const paymentLink = await this.razorpay.paymentLink.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        description: description,
        customer: {
          name: customerId.toString(),
        },
        notify: {
          sms: true,
          whatsapp: true
        },
        reminder_enable: true,
        callback_url: `${process.env.WEBSITE_URL}/payment/success`,
        callback_method: 'get'
      });

      logger.info(`Razorpay payment link created: ${paymentLink.id}`);

      return {
        success: true,
        paymentLink: paymentLink.short_url,
        paymentId: paymentLink.id,
        provider: 'razorpay'
      };

    } catch (error) {
      logger.error('Razorpay payment link creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Stripe payment link
   */
  async createStripeLink(customerId, amount, description, productCategory) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      // Create a product
      const product = await this.stripe.products.create({
        name: description,
        metadata: {
          customer_id: customerId.toString(),
          category: productCategory
        }
      });

      // Create a price
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: amount * 100, // Convert to cents
        currency: 'inr'
      });

      // Create payment link
      const paymentLink = await this.stripe.paymentLinks.create({
        line_items: [{
          price: price.id,
          quantity: 1
        }],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${process.env.WEBSITE_URL}/payment/success`
          }
        }
      });

      logger.info(`Stripe payment link created: ${paymentLink.id}`);

      return {
        success: true,
        paymentLink: paymentLink.url,
        paymentId: paymentLink.id,
        provider: 'stripe'
      };

    } catch (error) {
      logger.error('Stripe payment link creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create payment link (auto-select provider based on availability)
   */
  async createPaymentLink(customerId, amount, description, productCategory) {
    // Try Razorpay first (preferred for India)
    if (this.razorpay) {
      return await this.createRazorpayLink(customerId, amount, description, productCategory);
    }

    // Fallback to Stripe
    if (this.stripe) {
      return await this.createStripeLink(customerId, amount, description, productCategory);
    }

    logger.error('No payment gateway configured');
    return {
      success: false,
      error: 'No payment gateway configured'
    };
  }

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(paymentId, signature, orderId) {
    try {
      const crypto = require('crypto');
      const body = orderId + '|' + paymentId;
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isValid = expectedSignature === signature;

      if (isValid) {
        logger.info(`Payment verified successfully: ${paymentId}`);
      } else {
        logger.error(`Payment verification failed: ${paymentId}`);
      }

      return isValid;

    } catch (error) {
      logger.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Get payment status from Razorpay
   */
  async getRazorpayPaymentStatus(paymentId) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not configured');
      }

      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        success: true,
        status: payment.status,
        amount: payment.amount / 100,
        method: payment.method,
        data: payment
      };

    } catch (error) {
      logger.error('Error fetching Razorpay payment status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment status from Stripe
   */
  async getStripePaymentStatus(paymentIntentId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        method: paymentIntent.payment_method,
        data: paymentIntent
      };

    } catch (error) {
      logger.error('Error fetching Stripe payment status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PaymentService();

