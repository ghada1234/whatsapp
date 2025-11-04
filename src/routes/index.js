const express = require('express');
const router = express.Router();

// Import controllers
const webhookController = require('../controllers/webhook.controller');
const customerController = require('../controllers/customer.controller');
const campaignController = require('../controllers/campaign.controller');
const analyticsService = require('../services/analytics.service');

// File upload middleware
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv' && ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only CSV and Excel files are allowed'));
    }
    cb(null, true);
  }
});

// Webhook routes
router.get('/webhook', webhookController.verify.bind(webhookController));
router.post('/webhook', webhookController.handleEvent.bind(webhookController));

// Customer routes
router.get('/api/customers', customerController.getAll.bind(customerController));
router.get('/api/customers/stats', customerController.getStats.bind(customerController));
router.get('/api/customers/:id', customerController.getById.bind(customerController));
router.post('/api/customers', customerController.create.bind(customerController));
router.put('/api/customers/:id', customerController.update.bind(customerController));
router.delete('/api/customers/:id', customerController.delete.bind(customerController));
router.post('/api/customers/upload', upload.single('file'), customerController.uploadCSV.bind(customerController));

// Campaign routes
router.get('/api/campaigns', campaignController.getAll.bind(campaignController));
router.get('/api/campaigns/:id', campaignController.getById.bind(campaignController));
router.get('/api/campaigns/:id/analytics', campaignController.getAnalytics.bind(campaignController));
router.post('/api/campaigns', campaignController.create.bind(campaignController));
router.post('/api/campaigns/:id/start', campaignController.start.bind(campaignController));
router.post('/api/campaigns/:id/cancel', campaignController.cancel.bind(campaignController));

// Analytics routes
router.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api/analytics/engagement', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await analyticsService.getEngagementAnalytics(startDate, endDate);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api/analytics/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const csv = await analyticsService.exportAnalytics(startDate, endDate);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${startDate}-${endDate}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Product categories routes
router.get('/api/categories', async (req, res) => {
  try {
    const db = require('../config/database');
    const [categories] = await db.query('SELECT * FROM product_categories WHERE is_active = TRUE');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/categories', async (req, res) => {
  try {
    const { category_name, category_slug, product_url, description } = req.body;
    const db = require('../config/database');
    
    const [result] = await db.query(
      `INSERT INTO product_categories (category_name, category_slug, product_url, description) 
       VALUES (?, ?, ?, ?)`,
      [category_name, category_slug, product_url, description]
    );

    res.status(201).json({ 
      success: true, 
      data: { id: result.insertId, category_name, category_slug } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'WhatsApp Business API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

