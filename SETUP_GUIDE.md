# WhatsApp Business API - Complete Setup Guide

This guide will walk you through setting up the entire WhatsApp Business API Integration system from scratch.

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js v16+ installed
- ✅ MySQL 5.7+ installed and running
- ✅ A Meta Business Account
- ✅ Access to WhatsApp Business API
- ✅ A domain with HTTPS (for webhook)

## Step 1: Local Development Setup

### 1.1 Install Dependencies

```bash
cd /Users/ghadaalani/Desktop/new-proje
npm install
```

### 1.2 Install Admin Dashboard Dependencies

```bash
cd admin
npm install
cd ..
```

## Step 2: Database Configuration

### 2.1 Create MySQL Database

Login to MySQL:
```bash
mysql -u root -p
```

Create database:
```sql
CREATE DATABASE whatsapp_business;
EXIT;
```

### 2.2 Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=whatsapp_business
DB_PORT=3306
```

### 2.3 Run Database Migrations

```bash
npm run migrate
```

You should see:
```
✅ Database migrations completed successfully
✅ Tables created and initialized
```

## Step 3: WhatsApp Business API Setup

### 3.1 Create Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Click "Create Account"
3. Follow the setup wizard
4. Verify your business

### 3.2 Set Up WhatsApp Business API

1. Visit [Meta for Developers](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Fill in app details
5. Add "WhatsApp" product to your app

### 3.3 Get API Credentials

In the WhatsApp dashboard:

1. **Phone Number ID**:
   - Go to WhatsApp → API Setup
   - Copy the "Phone number ID"

2. **Access Token**:
   - Click "Generate Token"
   - Copy the temporary token
   - For production, create a permanent System User token

3. **Business Account ID**:
   - Found in WhatsApp → API Setup
   - Copy "WhatsApp Business Account ID"

### 3.4 Configure Webhook

1. In your `.env` file, add:
```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_VERIFY_TOKEN=my_secret_verify_token_123
```

2. For local development, use ngrok to create a public URL:
```bash
ngrok http 3000
```

3. In Meta Developers Console:
   - Go to WhatsApp → Configuration
   - Click "Edit" under Webhook
   - Enter: `https://your-ngrok-url.ngrok.io/webhook`
   - Enter verify token: `my_secret_verify_token_123`
   - Subscribe to: `messages` and `message_status`

### 3.5 Add Test Number

1. In WhatsApp → API Setup
2. Click "To" field
3. Add your WhatsApp number for testing
4. Verify with the code sent to your phone

## Step 4: Create WhatsApp Message Templates

WhatsApp requires pre-approved templates for promotional messages.

### 4.1 Access Template Manager

1. Go to WhatsApp Manager
2. Click "Message Templates"
3. Click "Create Template"

### 4.2 Sample Template - Product Showcase

**Template Name**: `product_showcase`

**Category**: Marketing

**Language**: English

**Header**: Text
```
{{1}} Collection
```

**Body**:
```
Hi {{1}}! 👋

We have some beautiful {{2}} collections just for you! ✨

Tap below to explore our latest designs.
```

**Footer**:
```
Free shipping on orders above ₹999
```

**Buttons**:
- Button 1: Quick Reply - "View Collection"
- Button 2: Quick Reply - "Remind Me Later"

### 4.3 Submit for Approval

1. Click "Submit"
2. Wait for Meta approval (usually 24-48 hours)
3. Once approved, note the template name

## Step 5: Payment Gateway Setup (Optional)

### 5.1 Razorpay Setup

1. Create account at [Razorpay](https://razorpay.com)
2. Go to Settings → API Keys
3. Generate test/live keys
4. Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### 5.2 Stripe Setup

1. Create account at [Stripe](https://stripe.com)
2. Go to Developers → API keys
3. Copy Secret key
4. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
```

## Step 6: Configure Application Settings

### 6.1 Update Website URLs

In `.env`:
```env
WEBSITE_URL=https://your-website.com
CHECKOUT_URL=https://your-website.com/checkout
```

### 6.2 Set JWT Secret

```env
JWT_SECRET=your_random_secret_key_here_min_32_chars
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6.3 Configure Admin User

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password
```

## Step 7: Start the Application

### 7.1 Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 WhatsApp Business API Server running on port 3000
📍 Environment: development
🔗 Webhook URL: http://localhost:3000/webhook
```

### 7.2 Start Scheduler (New Terminal)

```bash
npm run scheduler
```

You should see:
```
🚀 Starting scheduler service...
✅ Scheduler started with 3 jobs
  - Daily Reminders
  - Daily Analytics
  - Hourly Reminder Check
```

### 7.3 Start Admin Dashboard (New Terminal)

```bash
cd admin
npm start
```

Opens browser at `http://localhost:3001`

## Step 8: Initial Data Setup

### 8.1 Add Product Categories

Using the API:
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "category_name": "Banarasi Saree",
    "category_slug": "banarasi-saree",
    "product_url": "/collections/banarasi-saree",
    "description": "Authentic Banarasi silk sarees"
  }'
```

Or add via database (already included in migrations):
- Banarasi Saree
- Kurta
- Silk
- Wedding Collection
- Festive Wear

### 8.2 Upload Customer List

1. Create a CSV file (`customers.csv`):
```csv
name,whatsapp_number,interest_category
Priya Sharma,919876543210,Banarasi Saree
Rahul Kumar,918765432109,Kurta
Anjali Patel,917654321098,Silk
```

2. In Admin Dashboard:
   - Go to Customers
   - Click "Upload CSV"
   - Select your file
   - Click "Upload"

## Step 9: Test the System

### 9.1 Create a Test Campaign

1. Open Admin Dashboard
2. Go to Campaigns
3. Click "New Campaign"
4. Fill in:
   - Name: "Test Campaign"
   - Category: Select one
5. Click "Create"
6. Click "Start" button

### 9.2 Verify Message Delivery

1. Check your test WhatsApp number
2. You should receive a message with buttons
3. Click "Remind Me Later"
4. Select a reminder time
5. Verify confirmation message

### 9.3 Check Analytics

1. Go to Dashboard
2. Verify message statistics updated
3. Go to Analytics
4. Check engagement metrics

## Step 10: Production Deployment

### 10.1 Server Setup

Recommended: Use Ubuntu 20.04+ on DigitalOcean, AWS, or similar.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 10.2 Deploy Application

```bash
# Clone your repository
git clone your-repo-url
cd new-proje

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Update with production values

# Run migrations
npm run migrate

# Build admin dashboard
cd admin
npm install
npm run build
cd ..

# Start with PM2
pm2 start src/server.js --name whatsapp-api
pm2 start src/services/scheduler.js --name scheduler
pm2 save
pm2 startup
```

### 10.3 Configure Nginx

Create file `/etc/nginx/sites-available/whatsapp-api`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10.4 Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 10.5 Update WhatsApp Webhook

In Meta Developers Console:
- Update webhook URL to: `https://your-domain.com/webhook`
- Verify and save

## Step 11: Monitoring & Maintenance

### 11.1 View Logs

```bash
# Application logs
pm2 logs whatsapp-api

# Scheduler logs
pm2 logs scheduler

# Log files
tail -f logs/app.log
tail -f logs/error.log
```

### 11.2 Database Backup

Setup daily backups:
```bash
# Create backup script
cat > /home/backup-db.sh << 'EOF'
#!/bin/bash
mysqldump -u root -p'your_password' whatsapp_business > /backups/whatsapp_$(date +%Y%m%d).sql
find /backups -name "whatsapp_*.sql" -mtime +7 -delete
EOF

chmod +x /home/backup-db.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/backup-db.sh
```

### 11.3 Monitor Application

```bash
pm2 monit
```

## Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"

# Verify .env credentials
cat .env | grep DB_
```

### Issue: Webhook Verification Failed

**Solution:**
1. Check verify token in `.env` matches Meta console
2. Ensure server is running
3. Test webhook endpoint:
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=my_secret_verify_token_123&hub.challenge=test"
```

### Issue: Messages Not Sending

**Solution:**
1. Verify WhatsApp access token is valid
2. Check template is approved
3. Ensure recipient number is in correct format (country code without +)
4. Check logs: `tail -f logs/error.log`

### Issue: Scheduler Not Working

**Solution:**
```bash
# Check scheduler is running
pm2 list

# Restart scheduler
pm2 restart scheduler

# Check scheduler logs
pm2 logs scheduler --lines 50
```

## Success Checklist

- [ ] Database created and migrated
- [ ] WhatsApp API credentials configured
- [ ] Webhook verified and connected
- [ ] Message templates approved
- [ ] Payment gateway configured (if needed)
- [ ] Customers uploaded
- [ ] Test campaign sent successfully
- [ ] Reminders working
- [ ] Analytics tracking correctly
- [ ] Admin dashboard accessible
- [ ] Production server deployed (if applicable)
- [ ] SSL certificate installed
- [ ] Backups configured

## Next Steps

1. **Customize Message Templates**: Create more templates for different use cases
2. **Brand Admin Dashboard**: Add your logo and colors
3. **Integrate with Website**: Connect product catalog
4. **Scale**: Set up load balancer if needed
5. **Monitor**: Set up alerts for errors

## Support Resources

- WhatsApp API Docs: https://developers.facebook.com/docs/whatsapp
- Meta Business Help: https://business.facebook.com/help
- Node.js Docs: https://nodejs.org/docs
- MySQL Docs: https://dev.mysql.com/doc

---

🎉 Congratulations! Your WhatsApp Business API system is ready to use!

