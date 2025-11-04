const db = require('../config/database');
const whatsappService = require('../services/whatsapp.service');
const reminderService = require('../services/reminder.service');
const logger = require('../utils/logger');
const moment = require('moment');

class WebhookController {
  /**
   * Verify webhook (GET request from WhatsApp)
   */
  async verify(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        logger.info('Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        logger.error('Webhook verification failed');
        res.sendStatus(403);
      }
    } catch (error) {
      logger.error('Webhook verification error:', error);
      res.sendStatus(500);
    }
  }

  /**
   * Handle incoming webhook events (POST request from WhatsApp)
   */
  async handleEvent(req, res) {
    try {
      const body = req.body;

      // Acknowledge receipt immediately
      res.sendStatus(200);

      // Process webhook asynchronously
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await this.processMessage(change.value);
            }
          }
        }
      }

    } catch (error) {
      logger.error('Webhook handling error:', error);
    }
  }

  /**
   * Process incoming message
   */
  async processMessage(value) {
    try {
      const messages = value.messages;
      if (!messages) return;

      for (const message of messages) {
        const from = message.from;
        const messageId = message.id;

        logger.info(`Processing message from ${from}: ${messageId}`);

        // Mark message as read
        await whatsappService.markAsRead(messageId);

        // Get customer info
        const [customers] = await db.query(
          'SELECT * FROM customers WHERE whatsapp_number = ?',
          [from]
        );

        if (customers.length === 0) {
          logger.warn(`Unknown customer: ${from}`);
          continue;
        }

        const customer = customers[0];

        // Handle interactive button responses
        if (message.type === 'interactive') {
          await this.handleInteractiveResponse(customer, message);
        }

        // Handle text messages
        if (message.type === 'text') {
          await this.handleTextMessage(customer, message);
        }

        // Update message status if exists
        if (value.statuses) {
          await this.updateMessageStatuses(value.statuses);
        }
      }

    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  /**
   * Handle interactive button responses
   */
  async handleInteractiveResponse(customer, message) {
    try {
      const buttonReply = message.interactive.button_reply;
      const buttonId = buttonReply.id;

      logger.info(`Button clicked by ${customer.whatsapp_number}: ${buttonId}`);

      // Get the last message sent to this customer
      const [lastMessage] = await db.query(
        `SELECT id FROM messages 
         WHERE customer_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [customer.id]
      );

      const messageId = lastMessage.length > 0 ? lastMessage[0].id : null;

      // Handle different button actions
      if (buttonId === 'view_collection') {
        // Log interaction
        await db.query(
          `INSERT INTO user_interactions 
           (customer_id, message_id, interaction_type, button_id) 
           VALUES (?, ?, 'view_collection', ?)`,
          [customer.id, messageId, buttonId]
        );

        // Get product URL
        const [categories] = await db.query(
          'SELECT product_url FROM product_categories WHERE category_name = ?',
          [customer.interest_category]
        );

        const productUrl = categories.length > 0 
          ? `${process.env.WEBSITE_URL}${categories[0].product_url}`
          : process.env.WEBSITE_URL;

        // Send collection link with checkout option
        await this.sendCollectionLink(customer, productUrl);

      } else if (buttonId === 'remind_later') {
        // Log interaction
        await db.query(
          `INSERT INTO user_interactions 
           (customer_id, message_id, interaction_type, button_id) 
           VALUES (?, ?, 'remind_later', ?)`,
          [customer.id, messageId, buttonId]
        );

        // Send reminder time options
        await whatsappService.sendReminderOptions(
          customer.whatsapp_number,
          customer.name
        );

      } else if (buttonId.startsWith('remind_')) {
        // Extract days from button ID (e.g., "remind_7" -> 7)
        const days = parseInt(buttonId.split('_')[1]);

        // Create reminder
        const result = await reminderService.createReminder(
          customer.id,
          messageId,
          days
        );

        if (result.success) {
          const reminderDate = moment(result.reminderDate).format('DD MMM YYYY');
          
          // Send confirmation
          await whatsappService.sendReminderConfirmation(
            customer.whatsapp_number,
            customer.name,
            days,
            reminderDate
          );

          // Log interaction
          await db.query(
            `INSERT INTO user_interactions 
             (customer_id, message_id, interaction_type, button_id, additional_data) 
             VALUES (?, ?, 'remind_later', ?, ?)`,
            [customer.id, messageId, buttonId, JSON.stringify({ days, reminderDate })]
          );
        }

      } else if (buttonId === 'checkout') {
        // Log checkout interaction
        await db.query(
          `INSERT INTO user_interactions 
           (customer_id, message_id, interaction_type, button_id) 
           VALUES (?, ?, 'checkout', ?)`,
          [customer.id, messageId, buttonId]
        );

        // Send checkout link
        await this.sendCheckoutLink(customer);
      }

    } catch (error) {
      logger.error('Error handling interactive response:', error);
    }
  }

  /**
   * Handle text messages
   */
  async handleTextMessage(customer, message) {
    try {
      const text = message.text.body.toLowerCase();

      // Simple keyword responses
      if (text.includes('help') || text.includes('support')) {
        // Send help message
        // Implement as needed
      }

    } catch (error) {
      logger.error('Error handling text message:', error);
    }
  }

  /**
   * Send collection link with checkout button
   */
  async sendCollectionLink(customer, productUrl) {
    try {
      const bodyText = `Here's our ${customer.interest_category} collection! 🛍️\n\n${productUrl}\n\nFound something you love? Proceed to checkout below!`;

      const buttons = [
        { id: 'checkout', title: '🛒 Checkout' },
        { id: 'remind_later', title: '⏰ Remind Later' }
      ];

      await whatsappService.sendInteractiveMessage(
        customer.whatsapp_number,
        bodyText,
        buttons,
        'View Collection',
        'Free shipping on orders above ₹999'
      );

    } catch (error) {
      logger.error('Error sending collection link:', error);
    }
  }

  /**
   * Send checkout link
   */
  async sendCheckoutLink(customer) {
    try {
      const checkoutUrl = `${process.env.CHECKOUT_URL}?customer=${customer.id}&category=${encodeURIComponent(customer.interest_category)}`;

      const bodyText = `Great choice! 🎉\n\nComplete your purchase here:\n${checkoutUrl}\n\nWe accept all major payment methods via Razorpay/Stripe.\n\nNeed help? Just reply to this message!`;

      const payload = {
        messaging_product: 'whatsapp',
        to: customer.whatsapp_number,
        type: 'text',
        text: { body: bodyText }
      };

      const axios = require('axios');
      await axios.post(
        `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      logger.error('Error sending checkout link:', error);
    }
  }

  /**
   * Update message statuses
   */
  async updateMessageStatuses(statuses) {
    try {
      for (const status of statuses) {
        const messageId = status.id;
        const statusValue = status.status;

        await db.query(
          `UPDATE messages 
           SET status = ?, 
               ${statusValue}_at = NOW() 
           WHERE whatsapp_message_id = ?`,
          [statusValue, messageId]
        );

        logger.info(`Message ${messageId} status updated to ${statusValue}`);
      }

    } catch (error) {
      logger.error('Error updating message statuses:', error);
    }
  }
}

module.exports = new WebhookController();

