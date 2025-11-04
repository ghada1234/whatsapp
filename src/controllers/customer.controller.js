const db = require('../config/database');
const csv = require('csv-parser');
const fs = require('fs');
const logger = require('../utils/logger');

class CustomerController {
  /**
   * Get all customers
   */
  async getAll(req, res) {
    try {
      const { category, status, search, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM customers WHERE 1=1';
      const params = [];

      if (category) {
        query += ' AND interest_category = ?';
        params.push(category);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (search) {
        query += ' AND (name LIKE ? OR whatsapp_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [customers] = await db.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
      const countParams = params.slice(0, -2); // Remove limit and offset

      if (category) countQuery += ' AND interest_category = ?';
      if (status) countQuery += ' AND status = ?';
      if (search) countQuery += ' AND (name LIKE ? OR whatsapp_number LIKE ?)';

      const [countResult] = await db.query(countQuery, countParams);

      res.json({
        success: true,
        data: customers,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      });

    } catch (error) {
      logger.error('Error getting customers:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get customer by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const [customers] = await db.query(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );

      if (customers.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Get customer's message history
      const [messages] = await db.query(
        `SELECT * FROM messages 
         WHERE customer_id = ? 
         ORDER BY created_at DESC 
         LIMIT 20`,
        [id]
      );

      // Get customer's reminders
      const [reminders] = await db.query(
        `SELECT * FROM reminders 
         WHERE customer_id = ? 
         ORDER BY reminder_date DESC`,
        [id]
      );

      // Get customer's interactions
      const [interactions] = await db.query(
        `SELECT * FROM user_interactions 
         WHERE customer_id = ? 
         ORDER BY created_at DESC 
         LIMIT 20`,
        [id]
      );

      res.json({
        success: true,
        data: {
          customer: customers[0],
          messages,
          reminders,
          interactions
        }
      });

    } catch (error) {
      logger.error('Error getting customer:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create new customer
   */
  async create(req, res) {
    try {
      const { name, whatsapp_number, interest_category, status = 'active' } = req.body;

      if (!name || !whatsapp_number || !interest_category) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Check if customer already exists
      const [existing] = await db.query(
        'SELECT id FROM customers WHERE whatsapp_number = ?',
        [whatsapp_number]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Customer with this WhatsApp number already exists'
        });
      }

      const [result] = await db.query(
        `INSERT INTO customers (name, whatsapp_number, interest_category, status) 
         VALUES (?, ?, ?, ?)`,
        [name, whatsapp_number, interest_category, status]
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          name,
          whatsapp_number,
          interest_category,
          status
        }
      });

    } catch (error) {
      logger.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update customer
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, interest_category, status } = req.body;

      const updates = [];
      const params = [];

      if (name) {
        updates.push('name = ?');
        params.push(name);
      }

      if (interest_category) {
        updates.push('interest_category = ?');
        params.push(interest_category);
      }

      if (status) {
        updates.push('status = ?');
        params.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      params.push(id);

      await db.query(
        `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      res.json({
        success: true,
        message: 'Customer updated successfully'
      });

    } catch (error) {
      logger.error('Error updating customer:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete customer
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      await db.query('DELETE FROM customers WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting customer:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Upload customers from CSV
   */
  async uploadCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const results = [];
      const errors = [];

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', async () => {
          let successCount = 0;
          let errorCount = 0;

          for (const row of results) {
            try {
              const { name, whatsapp_number, interest_category } = row;

              if (!name || !whatsapp_number || !interest_category) {
                errors.push({
                  row,
                  error: 'Missing required fields'
                });
                errorCount++;
                continue;
              }

              // Check if customer exists
              const [existing] = await db.query(
                'SELECT id FROM customers WHERE whatsapp_number = ?',
                [whatsapp_number]
              );

              if (existing.length > 0) {
                // Update existing customer
                await db.query(
                  'UPDATE customers SET name = ?, interest_category = ? WHERE whatsapp_number = ?',
                  [name, interest_category, whatsapp_number]
                );
              } else {
                // Create new customer
                await db.query(
                  `INSERT INTO customers (name, whatsapp_number, interest_category, status) 
                   VALUES (?, ?, ?, 'active')`,
                  [name, whatsapp_number, interest_category]
                );
              }

              successCount++;

            } catch (error) {
              errors.push({
                row,
                error: error.message
              });
              errorCount++;
            }
          }

          // Delete uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: 'CSV upload completed',
            stats: {
              total: results.length,
              success: successCount,
              errors: errorCount
            },
            errors: errors.length > 0 ? errors : undefined
          });
        })
        .on('error', (error) => {
          logger.error('Error parsing CSV:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        });

    } catch (error) {
      logger.error('Error uploading CSV:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get customer statistics
   */
  async getStats(req, res) {
    try {
      const [totalCustomers] = await db.query(
        'SELECT COUNT(*) as total FROM customers WHERE status = "active"'
      );

      const [byCategory] = await db.query(
        `SELECT interest_category, COUNT(*) as count 
         FROM customers 
         WHERE status = 'active' 
         GROUP BY interest_category`
      );

      const [byStatus] = await db.query(
        `SELECT status, COUNT(*) as count 
         FROM customers 
         GROUP BY status`
      );

      res.json({
        success: true,
        data: {
          total: totalCustomers[0].total,
          byCategory,
          byStatus
        }
      });

    } catch (error) {
      logger.error('Error getting customer stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CustomerController();

