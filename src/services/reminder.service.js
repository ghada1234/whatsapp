const db = require('../config/database');
const whatsappService = require('./whatsapp.service');
const logger = require('../utils/logger');
const moment = require('moment');

class ReminderService {
  /**
   * Create a new reminder
   */
  async createReminder(customerId, messageId, reminderDays) {
    try {
      const reminderDate = moment().add(reminderDays, 'days').format('YYYY-MM-DD');

      const [result] = await db.query(
        `INSERT INTO reminders (customer_id, message_id, reminder_date, reminder_days, status) 
         VALUES (?, ?, ?, ?, 'scheduled')`,
        [customerId, messageId, reminderDate, reminderDays]
      );

      logger.info(`Reminder created for customer ${customerId} on ${reminderDate}`);

      return {
        success: true,
        reminderId: result.insertId,
        reminderDate: reminderDate
      };

    } catch (error) {
      logger.error('Failed to create reminder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pending reminders for today
   */
  async getPendingReminders() {
    try {
      const today = moment().format('YYYY-MM-DD');

      const [reminders] = await db.query(
        `SELECT r.*, c.name, c.whatsapp_number, c.interest_category
         FROM reminders r
         JOIN customers c ON r.customer_id = c.id
         WHERE r.reminder_date <= ? AND r.status = 'scheduled'
         ORDER BY r.reminder_date ASC`,
        [today]
      );

      return reminders;

    } catch (error) {
      logger.error('Failed to get pending reminders:', error);
      return [];
    }
  }

  /**
   * Process pending reminders
   */
  async processPendingReminders() {
    try {
      const reminders = await this.getPendingReminders();
      logger.info(`Processing ${reminders.length} pending reminders`);

      let successCount = 0;
      let failCount = 0;

      for (const reminder of reminders) {
        try {
          // Get product URL for this category
          const [categories] = await db.query(
            'SELECT product_url FROM product_categories WHERE category_name = ?',
            [reminder.interest_category]
          );

          const productUrl = categories.length > 0 
            ? `${process.env.WEBSITE_URL}${categories[0].product_url}`
            : process.env.WEBSITE_URL;

          // Send reminder message
          const result = await whatsappService.sendProductMessage(
            {
              name: reminder.name,
              whatsapp_number: reminder.whatsapp_number,
              interest_category: reminder.interest_category
            },
            productUrl,
            process.env.CHECKOUT_URL
          );

          if (result.success) {
            // Create message record
            const [messageResult] = await db.query(
              `INSERT INTO messages (customer_id, message_type, whatsapp_message_id, status, sent_at) 
               VALUES (?, 'reminder', ?, 'sent', NOW())`,
              [reminder.customer_id, result.messageId]
            );

            // Update reminder status
            await db.query(
              'UPDATE reminders SET status = \'sent\', sent_at = NOW() WHERE id = ?',
              [reminder.id]
            );

            successCount++;
            logger.info(`Reminder sent successfully to ${reminder.whatsapp_number}`);

          } else {
            failCount++;
            logger.error(`Failed to send reminder to ${reminder.whatsapp_number}`);
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          failCount++;
          logger.error(`Error processing reminder ${reminder.id}:`, error);
        }
      }

      logger.info(`Reminder processing complete: ${successCount} sent, ${failCount} failed`);

      return {
        success: true,
        processed: reminders.length,
        sent: successCount,
        failed: failCount
      };

    } catch (error) {
      logger.error('Failed to process pending reminders:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(reminderId) {
    try {
      await db.query(
        'UPDATE reminders SET status = \'cancelled\' WHERE id = ?',
        [reminderId]
      );

      return { success: true };

    } catch (error) {
      logger.error('Failed to cancel reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get customer reminders
   */
  async getCustomerReminders(customerId) {
    try {
      const [reminders] = await db.query(
        `SELECT * FROM reminders 
         WHERE customer_id = ? 
         ORDER BY reminder_date DESC`,
        [customerId]
      );

      return reminders;

    } catch (error) {
      logger.error('Failed to get customer reminders:', error);
      return [];
    }
  }
}

module.exports = new ReminderService();

