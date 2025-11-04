const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Message sent to ${to}: ${response.data.messages[0].id}`);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };

    } catch (error) {
      logger.error(`Failed to send message to ${to}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send interactive message with buttons
   */
  async sendInteractiveMessage(to, bodyText, buttons, headerText = null, footerText = null) {
    try {
      const interactive = {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map((btn, idx) => ({
            type: 'reply',
            reply: {
              id: btn.id || `btn_${idx}`,
              title: btn.title.substring(0, 20) // Max 20 chars
            }
          }))
        }
      };

      if (headerText) {
        interactive.header = {
          type: 'text',
          text: headerText
        };
      }

      if (footerText) {
        interactive.footer = {
          text: footerText
        };
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: interactive
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Interactive message sent to ${to}: ${response.data.messages[0].id}`);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };

    } catch (error) {
      logger.error(`Failed to send interactive message to ${to}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send interactive list message
   */
  async sendListMessage(to, bodyText, buttonText, sections, headerText = null, footerText = null) {
    try {
      const interactive = {
        type: 'list',
        body: {
          text: bodyText
        },
        action: {
          button: buttonText,
          sections: sections
        }
      };

      if (headerText) {
        interactive.header = {
          type: 'text',
          text: headerText
        };
      }

      if (footerText) {
        interactive.footer = {
          text: footerText
        };
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: interactive
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`List message sent to ${to}: ${response.data.messages[0].id}`);
      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data
      };

    } catch (error) {
      logger.error(`Failed to send list message to ${to}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Send product collection message with reminder options
   */
  async sendProductMessage(customerData, productUrl, checkoutUrl) {
    const { name, whatsapp_number, interest_category } = customerData;

    const bodyText = `Hi ${name}! 👋\n\nWe have some beautiful ${interest_category} collections just for you! ✨\n\nTap below to explore our latest designs.`;
    
    const buttons = [
      {
        id: 'view_collection',
        title: '👗 View Collection'
      },
      {
        id: 'remind_later',
        title: '⏰ Remind Me Later'
      }
    ];

    const footerText = 'Free shipping on orders above ₹999';

    return await this.sendInteractiveMessage(
      whatsapp_number,
      bodyText,
      buttons,
      `${interest_category} Collection`,
      footerText
    );
  }

  /**
   * Send reminder time selection message
   */
  async sendReminderOptions(to, customerName) {
    const bodyText = `Hi ${customerName}! When would you like us to remind you?`;

    const buttons = [
      { id: 'remind_7', title: '📅 7 Days' },
      { id: 'remind_15', title: '📅 15 Days' },
      { id: 'remind_21', title: '📅 21 Days' }
    ];

    return await this.sendInteractiveMessage(
      to,
      bodyText,
      buttons,
      'Set Reminder',
      'Choose your preferred reminder time'
    );
  }

  /**
   * Send reminder confirmation
   */
  async sendReminderConfirmation(to, customerName, days, reminderDate) {
    const bodyText = `Perfect, ${customerName}! ✅\n\nWe'll remind you in ${days} days (on ${reminderDate}).\n\nLooking forward to helping you find the perfect outfit! 🛍️`;

    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: bodyText
      }
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id
      };

    } catch (error) {
      logger.error(`Failed to send confirmation to ${to}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    try {
      await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true };

    } catch (error) {
      logger.error(`Failed to mark message as read:`, error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();

