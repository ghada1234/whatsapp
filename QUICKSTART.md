# Quick Start Guide

Get your WhatsApp Business API Integration running in 15 minutes!

## ⚡ Prerequisites

- Node.js 16+ installed
- MySQL installed and running
- WhatsApp Business API credentials (or use sandbox)

## 🚀 5-Step Quick Setup

### Step 1: Install Dependencies (2 min)

```bash
cd /Users/ghadaalani/Desktop/new-proje
npm install
```

### Step 2: Configure Environment (3 min)

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Required - Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=whatsapp_business

# Required - WhatsApp API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=my_secret_token_123

# Optional - Website URLs
WEBSITE_URL=https://your-website.com
CHECKOUT_URL=https://your-website.com/checkout
```

**Don't have WhatsApp credentials yet?** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

### Step 3: Setup Database (2 min)

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE whatsapp_business;"

# Run migrations
npm run migrate
```

You should see:
```
✅ Database migrations completed successfully
✅ Tables created and initialized
```

### Step 4: Start Application (1 min)

**Terminal 1 - Backend Server:**
```bash
npm run dev
```

**Terminal 2 - Scheduler Service:**
```bash
npm run scheduler
```

**Terminal 3 - Admin Dashboard (Optional):**
```bash
cd admin
npm install
npm start
```

### Step 5: Test It! (5 min)

#### Option A: Using Admin Dashboard

1. Open http://localhost:3001 in your browser
2. Go to "Customers" → "Upload CSV"
3. Upload `sample-customer-data.csv`
4. Go to "Campaigns" → "New Campaign"
5. Create and start a test campaign
6. Check your WhatsApp!

#### Option B: Using API Directly

```bash
# 1. Add a test customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "whatsapp_number": "919876543210",
    "interest_category": "Banarasi Saree"
  }'

# 2. Create a campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "Test Campaign",
    "template_id": 1,
    "target_category": "Banarasi Saree"
  }'

# 3. Start the campaign (replace {id} with campaign ID from step 2)
curl -X POST http://localhost:3000/api/campaigns/{id}/start
```

## 🎯 What You Get

After setup, you'll have:

✅ **Backend API** running on `http://localhost:3000`
- REST API for all operations
- WhatsApp webhook endpoint
- Automated message sending

✅ **Admin Dashboard** on `http://localhost:3001`
- Customer management
- Campaign creation
- Real-time analytics
- CSV upload/export

✅ **Scheduler Service**
- Automatic reminder processing
- Daily analytics updates
- Scheduled campaigns

✅ **Database**
- Customers and their preferences
- Message history
- Interaction tracking
- Analytics data

## 📱 WhatsApp Features

Your customers can now:

1. **Receive personalized messages** based on their interests
2. **Click interactive buttons** to view products or set reminders
3. **Choose reminder timeframes** (7, 15, or 21 days)
4. **Get automatic follow-ups** on their chosen dates
5. **Direct checkout links** for easy purchasing

## 🎨 Admin Dashboard Features

You can:

- 📊 View real-time analytics
- 👥 Manage customers (upload CSV, search, filter)
- 📧 Create and run campaigns
- 📈 Track engagement metrics
- 💾 Export data as CSV

## 📂 Project Structure

```
new-proje/
├── src/
│   ├── controllers/      # API endpoint handlers
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── database/         # Schema and migrations
│   └── server.js         # Main server
├── admin/                # React dashboard
├── uploads/              # Customer CSV uploads
├── logs/                 # Application logs
└── .env                  # Configuration
```

## 🔍 Testing the Flow

### Test Interactive Messages:

1. Send a message to your test number
2. Customer receives message with buttons:
   - "View Collection"
   - "Remind Me Later"
3. When they click "Remind Me Later":
   - Shows 3 options: 7, 15, or 21 days
   - Stores reminder in database
   - Sends confirmation
4. On the reminder date:
   - Scheduler automatically sends follow-up

## 📊 Check Your Data

```bash
# View customers
mysql -u root -p whatsapp_business -e "SELECT * FROM customers;"

# View messages
mysql -u root -p whatsapp_business -e "SELECT * FROM messages LIMIT 10;"

# View reminders
mysql -u root -p whatsapp_business -e "SELECT * FROM reminders;"
```

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed
```bash
# Verify MySQL is running
sudo systemctl status mysql  # Linux
brew services list           # Mac

# Test connection
mysql -u root -p -e "SELECT 1;"
```

### WhatsApp API Error
- Verify access token is valid
- Check phone number ID is correct
- Ensure test number is added in WhatsApp Business dashboard

## 📖 Next Steps

1. **Read Full Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. **Configure WhatsApp Webhook**: See SETUP_GUIDE.md Step 4
3. **Create Message Templates**: Required for production use
4. **Deploy to Production**: [DEPLOYMENT.md](DEPLOYMENT.md)
5. **Customize Dashboard**: Edit files in `admin/src/`

## 🛠️ Useful Commands

```bash
# Start everything
npm run dev              # Backend server
npm run scheduler        # Reminder scheduler
cd admin && npm start    # Admin dashboard

# Database
npm run migrate          # Run migrations
mysql -u root -p whatsapp_business  # Access database

# Logs
tail -f logs/app.log     # Application logs
tail -f logs/error.log   # Error logs

# Testing
curl http://localhost:3000/health  # Check server health
```

## 📞 API Endpoints

- `GET /health` - Health check
- `GET /webhook` - WhatsApp webhook verification
- `POST /webhook` - Receive WhatsApp events
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `POST /api/customers/upload` - Upload CSV
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/start` - Start campaign
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/export` - Export CSV

## 🎓 Learning Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Main README](README.md) - Complete feature list
- [Setup Guide](SETUP_GUIDE.md) - Detailed setup
- [Deployment Guide](DEPLOYMENT.md) - Production deployment

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Database created and migrated
- [ ] Backend server running
- [ ] Scheduler service running
- [ ] Admin dashboard accessible
- [ ] Sample customer uploaded
- [ ] Test campaign sent
- [ ] WhatsApp message received

## 🎉 You're Ready!

Your WhatsApp Business API Integration is now running!

**What to do next:**
1. Upload your real customer list
2. Create your first real campaign
3. Monitor the analytics dashboard
4. Set up WhatsApp webhook for production
5. Deploy to a live server

Need help? Check the detailed [SETUP_GUIDE.md](SETUP_GUIDE.md) or [DEPLOYMENT.md](DEPLOYMENT.md)!

---

**Happy Messaging! 📱✨**

