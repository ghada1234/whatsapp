# WhatsApp Business API Integration System

A comprehensive WhatsApp Business API integration platform with automated messaging, interactive flows, customer management, and analytics.

## 🌟 Features

### Core Features
- **WhatsApp Business API Integration**: Seamless integration with Meta's WhatsApp Business API
- **Interactive Message Flows**: Send messages with clickable buttons and interactive elements
- **Automated Reminders**: Smart reminder system with customizable scheduling (7, 15, or 21 days)
- **Customer Management**: Upload and manage customer data via CSV/Excel
- **Campaign Management**: Create and execute targeted marketing campaigns
- **Product Catalog Integration**: Dynamic product links based on customer interests
- **Payment Gateway Integration**: Support for Razorpay and Stripe
- **Real-time Analytics**: Comprehensive analytics and reporting dashboard
- **Message Status Tracking**: Track delivery, read receipts, and engagement

### Technical Features
- RESTful API architecture
- MySQL database with optimized schema
- Automated cron-based scheduler
- CSV/Excel export functionality
- Webhook handling for real-time updates
- Professional admin dashboard

## 📋 Requirements

- Node.js (v16 or higher)
- MySQL (v5.7 or higher)
- WhatsApp Business API access (Meta Business Account)
- Razorpay/Stripe account (for payment integration)

## 🚀 Installation

### 1. Clone and Setup

```bash
cd new-proje
npm install
```

### 2. Database Setup

Create a MySQL database and update the `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_business

# WhatsApp API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Payment Gateways
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
STRIPE_SECRET_KEY=your_stripe_key

# Website
WEBSITE_URL=https://your-website.com
```

Run database migrations:

```bash
npm run migrate
```

### 3. Start the Application

**Backend Server:**
```bash
npm start
# or for development
npm run dev
```

**Scheduler Service:**
```bash
npm run scheduler
```

**Admin Dashboard:**
```bash
cd admin
npm install
npm start
```

The admin dashboard will be available at `http://localhost:3001`

## 📁 Project Structure

```
new-proje/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── webhook.controller.js    # WhatsApp webhook handler
│   │   ├── customer.controller.js   # Customer management
│   │   └── campaign.controller.js   # Campaign management
│   ├── services/
│   │   ├── whatsapp.service.js      # WhatsApp API integration
│   │   ├── reminder.service.js      # Reminder logic
│   │   ├── analytics.service.js     # Analytics & reporting
│   │   └── scheduler.js             # Cron job scheduler
│   ├── routes/
│   │   └── index.js             # API routes
│   ├── utils/
│   │   └── logger.js            # Winston logger
│   ├── database/
│   │   ├── schema.sql           # Database schema
│   │   └── migrate.js           # Migration script
│   └── server.js                # Main server file
├── admin/                       # React admin dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Customers.js
│   │   │   ├── Campaigns.js
│   │   │   └── Analytics.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── uploads/                     # File uploads directory
├── logs/                        # Application logs
├── .env                         # Environment variables
└── package.json

```

## 🔌 API Endpoints

### Webhook
- `GET /webhook` - WhatsApp webhook verification
- `POST /webhook` - WhatsApp webhook events

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/upload` - Upload CSV file
- `GET /api/customers/stats` - Get customer statistics

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `POST /api/campaigns` - Create new campaign
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/cancel` - Cancel campaign
- `GET /api/campaigns/:id/analytics` - Get campaign analytics

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/engagement` - Get engagement analytics
- `GET /api/analytics/export` - Export analytics as CSV

### Categories
- `GET /api/categories` - Get all product categories
- `POST /api/categories` - Create new category

## 💬 WhatsApp Flow

### 1. Initial Product Message
When you send a message to a customer, they receive:
- Personalized greeting with their name
- Product collection information based on their interest
- Two interactive buttons:
  - **View Collection** - Opens product catalog
  - **Remind Me Later** - Sets a reminder

### 2. View Collection Flow
When customer clicks "View Collection":
- Receives product URL for their interest category
- Gets checkout button for direct purchase
- Interaction is tracked in analytics

### 3. Remind Me Later Flow
When customer clicks "Remind Me Later":
- Receives reminder time options (7, 15, or 21 days)
- Selects preferred reminder time
- Gets confirmation message with reminder date
- Automatic reminder sent on scheduled date

### 4. Checkout Flow
When customer clicks "Checkout":
- Receives payment link with integrated gateway
- Interaction tracked for analytics
- Can complete purchase directly through WhatsApp

## 📊 Database Schema

### Main Tables
- **customers** - Customer information and interests
- **message_templates** - WhatsApp message templates
- **messages** - Sent message records
- **reminders** - Scheduled reminders
- **user_interactions** - User button clicks and actions
- **campaigns** - Marketing campaigns
- **product_categories** - Product catalog
- **analytics_summary** - Daily analytics aggregation

## 🔄 Scheduler Jobs

The scheduler runs the following automated jobs:

1. **Daily Reminders (9 AM)**: Process all due reminders
2. **Hourly Check**: Check for urgent reminders
3. **Daily Analytics (Midnight)**: Update analytics summary

## 📤 CSV Upload Format

Upload customer lists using CSV/Excel with these columns:

```csv
name,whatsapp_number,interest_category
John Doe,919876543210,Banarasi Saree
Jane Smith,918765432109,Kurta
```

**Note**: WhatsApp numbers should include country code without '+' or spaces.

## 🎨 Admin Dashboard Features

### Dashboard
- Real-time statistics
- Message delivery metrics
- Recent activity feed
- Quick insights

### Customers
- View all customers
- Search and filter
- Upload CSV files
- Category-based filtering

### Campaigns
- Create new campaigns
- Target specific categories
- Start/stop campaigns
- Real-time progress tracking

### Analytics
- Engagement metrics
- Interaction tracking
- Category performance
- CSV export

## 🔐 WhatsApp Business API Setup

1. **Create Meta Business Account**
   - Go to [Meta Business Suite](https://business.facebook.com)
   - Create a business account

2. **Set Up WhatsApp Business API**
   - Access [Meta for Developers](https://developers.facebook.com)
   - Create a new app
   - Add WhatsApp product
   - Get Phone Number ID and Access Token

3. **Configure Webhook**
   - Set webhook URL: `https://your-domain.com/webhook`
   - Set verify token (same as in `.env`)
   - Subscribe to messages and message status

4. **Create Message Templates**
   - Templates must be approved by Meta
   - Create templates in WhatsApp Manager
   - Use template names in your campaigns

## 💳 Payment Integration

### Razorpay Setup
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Stripe Setup
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

## 📝 Logging

Logs are stored in the `logs/` directory:
- `app.log` - All application logs
- `error.log` - Error logs only

## 🔧 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### WhatsApp API Errors
- Verify access token is valid
- Check phone number ID
- Ensure webhook is properly configured
- Verify message templates are approved

### Scheduler Not Running
- Check cron job configuration
- Verify timezone settings
- Check scheduler logs

## 🚀 Deployment

### Production Checklist
1. Update `.env` with production credentials
2. Set `NODE_ENV=production`
3. Use process manager (PM2):
   ```bash
   pm2 start src/server.js --name "whatsapp-api"
   pm2 start src/services/scheduler.js --name "scheduler"
   ```
4. Set up SSL certificate for webhook
5. Configure firewall rules
6. Set up database backups
7. Build admin dashboard:
   ```bash
   cd admin
   npm run build
   ```

## 📊 Analytics & Reporting

Track key metrics:
- Message delivery rates
- User engagement
- Campaign performance
- Category-wise insights
- Customer interaction patterns

Export reports as CSV for further analysis.

## 🤝 Support

For issues and questions:
1. Check the logs in `logs/` directory
2. Review WhatsApp API documentation
3. Verify database schema matches `schema.sql`

## 📄 License

ISC

## 🔮 Future Enhancements

- Multi-language support
- A/B testing for campaigns
- Advanced segmentation
- WhatsApp Catalog integration
- Chatbot functionality
- Machine learning-based recommendations

---

Built with ❤️ for WhatsApp Business automation

