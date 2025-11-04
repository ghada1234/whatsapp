const db = require('../config/database');
const logger = require('../utils/logger');
const moment = require('moment');
const { Parser } = require('json2csv');

class AnalyticsService {
  /**
   * Update daily analytics summary
   */
  async updateDailySummary(date = null) {
    try {
      const targetDate = date || moment().subtract(1, 'day').format('YYYY-MM-DD');

      // Get message stats
      const [messageStats] = await db.query(
        `SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as total_delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as total_read,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed
         FROM messages 
         WHERE DATE(created_at) = ?`,
        [targetDate]
      );

      // Get interaction stats
      const [interactionStats] = await db.query(
        `SELECT COUNT(*) as total_interactions
         FROM user_interactions 
         WHERE DATE(created_at) = ?`,
        [targetDate]
      );

      // Get reminder stats
      const [reminderStats] = await db.query(
        `SELECT COUNT(*) as total_reminders
         FROM reminders 
         WHERE DATE(created_at) = ?`,
        [targetDate]
      );

      // Get checkout stats
      const [checkoutStats] = await db.query(
        `SELECT COUNT(*) as total_checkouts
         FROM user_interactions 
         WHERE interaction_type = 'checkout' AND DATE(created_at) = ?`,
        [targetDate]
      );

      // Insert or update summary
      await db.query(
        `INSERT INTO analytics_summary 
         (date, total_messages_sent, total_messages_delivered, total_messages_read, 
          total_messages_failed, total_interactions, total_reminders_set, total_checkouts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         total_messages_sent = VALUES(total_messages_sent),
         total_messages_delivered = VALUES(total_messages_delivered),
         total_messages_read = VALUES(total_messages_read),
         total_messages_failed = VALUES(total_messages_failed),
         total_interactions = VALUES(total_interactions),
         total_reminders_set = VALUES(total_reminders_set),
         total_checkouts = VALUES(total_checkouts)`,
        [
          targetDate,
          messageStats[0].total_sent,
          messageStats[0].total_delivered,
          messageStats[0].total_read,
          messageStats[0].total_failed,
          interactionStats[0].total_interactions,
          reminderStats[0].total_reminders,
          checkoutStats[0].total_checkouts
        ]
      );

      logger.info(`Analytics summary updated for ${targetDate}`);
      return { success: true };

    } catch (error) {
      logger.error('Failed to update analytics summary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [totalCustomers] = await db.query(
        'SELECT COUNT(*) as count FROM customers WHERE status = "active"'
      );

      const [totalMessages] = await db.query(
        'SELECT COUNT(*) as count FROM messages'
      );

      const [messagesDelivered] = await db.query(
        'SELECT COUNT(*) as count FROM messages WHERE status = "delivered" OR status = "read"'
      );

      const [pendingReminders] = await db.query(
        'SELECT COUNT(*) as count FROM reminders WHERE status = "scheduled"'
      );

      const [todayStats] = await db.query(
        `SELECT 
          COUNT(*) as messages_today,
          SUM(CASE WHEN status = 'delivered' OR status = 'read' THEN 1 ELSE 0 END) as delivered_today
         FROM messages 
         WHERE DATE(created_at) = CURDATE()`
      );

      const [recentActivity] = await db.query(
        `SELECT 
          m.id,
          m.message_type,
          m.status,
          m.created_at,
          c.name,
          c.whatsapp_number
         FROM messages m
         JOIN customers c ON m.customer_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 10`
      );

      const deliveryRate = totalMessages[0].count > 0 
        ? ((messagesDelivered[0].count / totalMessages[0].count) * 100).toFixed(2)
        : 0;

      return {
        totalCustomers: totalCustomers[0].count,
        totalMessages: totalMessages[0].count,
        messagesDelivered: messagesDelivered[0].count,
        pendingReminders: pendingReminders[0].count,
        messagesToday: todayStats[0].messages_today || 0,
        deliveredToday: todayStats[0].delivered_today || 0,
        deliveryRate: parseFloat(deliveryRate),
        recentActivity: recentActivity
      };

    } catch (error) {
      logger.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get engagement analytics
   */
  async getEngagementAnalytics(startDate, endDate) {
    try {
      const [interactions] = await db.query(
        `SELECT 
          interaction_type,
          COUNT(*) as count
         FROM user_interactions
         WHERE created_at BETWEEN ? AND ?
         GROUP BY interaction_type`,
        [startDate, endDate]
      );

      const [categoryEngagement] = await db.query(
        `SELECT 
          c.interest_category,
          COUNT(DISTINCT ui.customer_id) as engaged_customers,
          COUNT(ui.id) as total_interactions
         FROM user_interactions ui
         JOIN customers c ON ui.customer_id = c.id
         WHERE ui.created_at BETWEEN ? AND ?
         GROUP BY c.interest_category`,
        [startDate, endDate]
      );

      return {
        interactionsByType: interactions,
        categoryEngagement: categoryEngagement
      };

    } catch (error) {
      logger.error('Failed to get engagement analytics:', error);
      throw error;
    }
  }

  /**
   * Export analytics data as CSV
   */
  async exportAnalytics(startDate, endDate) {
    try {
      const [data] = await db.query(
        `SELECT 
          c.name,
          c.whatsapp_number,
          c.interest_category,
          COUNT(DISTINCT m.id) as messages_sent,
          COUNT(DISTINCT CASE WHEN m.status = 'delivered' OR m.status = 'read' THEN m.id END) as messages_delivered,
          COUNT(DISTINCT ui.id) as total_interactions,
          COUNT(DISTINCT r.id) as reminders_set
         FROM customers c
         LEFT JOIN messages m ON c.id = m.customer_id AND m.created_at BETWEEN ? AND ?
         LEFT JOIN user_interactions ui ON c.id = ui.customer_id AND ui.created_at BETWEEN ? AND ?
         LEFT JOIN reminders r ON c.id = r.customer_id AND r.created_at BETWEEN ? AND ?
         GROUP BY c.id`,
        [startDate, endDate, startDate, endDate, startDate, endDate]
      );

      const parser = new Parser({
        fields: [
          { label: 'Customer Name', value: 'name' },
          { label: 'WhatsApp Number', value: 'whatsapp_number' },
          { label: 'Interest Category', value: 'interest_category' },
          { label: 'Messages Sent', value: 'messages_sent' },
          { label: 'Messages Delivered', value: 'messages_delivered' },
          { label: 'Total Interactions', value: 'total_interactions' },
          { label: 'Reminders Set', value: 'reminders_set' }
        ]
      });

      const csv = parser.parse(data);
      return csv;

    } catch (error) {
      logger.error('Failed to export analytics:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId) {
    try {
      const [campaign] = await db.query(
        'SELECT * FROM campaigns WHERE id = ?',
        [campaignId]
      );

      if (campaign.length === 0) {
        throw new Error('Campaign not found');
      }

      const [messageStats] = await db.query(
        `SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM messages 
         WHERE template_id = ? AND created_at >= ?`,
        [campaign[0].template_id, campaign[0].started_at]
      );

      return {
        campaign: campaign[0],
        performance: messageStats[0]
      };

    } catch (error) {
      logger.error('Failed to get campaign performance:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();

