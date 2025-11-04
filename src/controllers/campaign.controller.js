const db = require('../config/database');
const whatsappService = require('../services/whatsapp.service');
const logger = require('../utils/logger');

class CampaignController {
  /**
   * Get all campaigns
   */
  async getAll(req, res) {
    try {
      const { status } = req.query;

      let query = 'SELECT c.*, t.template_name FROM campaigns c LEFT JOIN message_templates t ON c.template_id = t.id';
      const params = [];

      if (status) {
        query += ' WHERE c.status = ?';
        params.push(status);
      }

      query += ' ORDER BY c.created_at DESC';

      const [campaigns] = await db.query(query, params);

      res.json({
        success: true,
        data: campaigns
      });

    } catch (error) {
      logger.error('Error getting campaigns:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get campaign by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const [campaigns] = await db.query(
        `SELECT c.*, t.template_name, t.body_text 
         FROM campaigns c 
         LEFT JOIN message_templates t ON c.template_id = t.id 
         WHERE c.id = ?`,
        [id]
      );

      if (campaigns.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      res.json({
        success: true,
        data: campaigns[0]
      });

    } catch (error) {
      logger.error('Error getting campaign:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create new campaign
   */
  async create(req, res) {
    try {
      const { campaign_name, template_id, target_category, scheduled_at } = req.body;

      if (!campaign_name || !template_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Get recipients count
      let countQuery = 'SELECT COUNT(*) as count FROM customers WHERE status = "active"';
      const countParams = [];

      if (target_category) {
        countQuery += ' AND interest_category = ?';
        countParams.push(target_category);
      }

      const [recipientCount] = await db.query(countQuery, countParams);

      const [result] = await db.query(
        `INSERT INTO campaigns 
         (campaign_name, template_id, target_category, status, scheduled_at, total_recipients) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          campaign_name,
          template_id,
          target_category,
          scheduled_at ? 'scheduled' : 'draft',
          scheduled_at || null,
          recipientCount[0].count
        ]
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          campaign_name,
          total_recipients: recipientCount[0].count
        }
      });

    } catch (error) {
      logger.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Start campaign
   */
  async start(req, res) {
    try {
      const { id } = req.params;

      // Get campaign details
      const [campaigns] = await db.query(
        `SELECT c.*, t.template_name 
         FROM campaigns c 
         JOIN message_templates t ON c.template_id = t.id 
         WHERE c.id = ?`,
        [id]
      );

      if (campaigns.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      const campaign = campaigns[0];

      if (campaign.status === 'running' || campaign.status === 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Campaign is already running or completed'
        });
      }

      // Update campaign status
      await db.query(
        'UPDATE campaigns SET status = ?, started_at = NOW() WHERE id = ?',
        ['running', id]
      );

      // Get target customers
      let customerQuery = 'SELECT * FROM customers WHERE status = "active"';
      const customerParams = [];

      if (campaign.target_category) {
        customerQuery += ' AND interest_category = ?';
        customerParams.push(campaign.target_category);
      }

      const [customers] = await db.query(customerQuery, customerParams);

      // Start sending messages asynchronously
      this.sendCampaignMessages(id, campaign, customers);

      res.json({
        success: true,
        message: 'Campaign started',
        data: {
          id,
          total_recipients: customers.length
        }
      });

    } catch (error) {
      logger.error('Error starting campaign:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send campaign messages (async)
   */
  async sendCampaignMessages(campaignId, campaign, customers) {
    try {
      let sentCount = 0;
      let deliveredCount = 0;

      for (const customer of customers) {
        try {
          // Get product URL
          const [categories] = await db.query(
            'SELECT product_url FROM product_categories WHERE category_name = ?',
            [customer.interest_category]
          );

          const productUrl = categories.length > 0 
            ? `${process.env.WEBSITE_URL}${categories[0].product_url}`
            : process.env.WEBSITE_URL;

          // Send message
          const result = await whatsappService.sendProductMessage(
            customer,
            productUrl,
            process.env.CHECKOUT_URL
          );

          if (result.success) {
            // Record message
            await db.query(
              `INSERT INTO messages 
               (customer_id, template_id, message_type, whatsapp_message_id, status, sent_at) 
               VALUES (?, ?, 'promotional', ?, 'sent', NOW())`,
              [customer.id, campaign.template_id, result.messageId]
            );

            sentCount++;
          }

          // Add delay to avoid rate limiting (1 message per second)
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          logger.error(`Error sending message to customer ${customer.id}:`, error);
        }
      }

      // Update campaign as completed
      await db.query(
        `UPDATE campaigns 
         SET status = 'completed', 
             completed_at = NOW(), 
             messages_sent = ? 
         WHERE id = ?`,
        [sentCount, campaignId]
      );

      logger.info(`Campaign ${campaignId} completed: ${sentCount}/${customers.length} messages sent`);

    } catch (error) {
      logger.error('Error sending campaign messages:', error);
      
      // Mark campaign as failed
      await db.query(
        'UPDATE campaigns SET status = \'cancelled\' WHERE id = ?',
        [campaignId]
      );
    }
  }

  /**
   * Cancel campaign
   */
  async cancel(req, res) {
    try {
      const { id } = req.params;

      await db.query(
        'UPDATE campaigns SET status = \'cancelled\' WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Campaign cancelled'
      });

    } catch (error) {
      logger.error('Error cancelling campaign:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get campaign analytics
   */
  async getAnalytics(req, res) {
    try {
      const { id } = req.params;

      const [campaign] = await db.query(
        'SELECT * FROM campaigns WHERE id = ?',
        [id]
      );

      if (campaign.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Get message statistics
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

      // Get interaction statistics
      const [interactionStats] = await db.query(
        `SELECT 
          interaction_type,
          COUNT(*) as count
         FROM user_interactions ui
         JOIN messages m ON ui.message_id = m.id
         WHERE m.template_id = ? AND m.created_at >= ?
         GROUP BY interaction_type`,
        [campaign[0].template_id, campaign[0].started_at]
      );

      res.json({
        success: true,
        data: {
          campaign: campaign[0],
          messageStats: messageStats[0],
          interactionStats
        }
      });

    } catch (error) {
      logger.error('Error getting campaign analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CampaignController();

