# Deployment Guide

This guide covers deploying the WhatsApp Business API Integration system to production.

## Deployment Options

### Option 1: DigitalOcean App Platform (Easiest)
### Option 2: AWS EC2
### Option 3: Heroku
### Option 4: Custom VPS

---

## Option 1: DigitalOcean App Platform

### Prerequisites
- DigitalOcean account
- GitHub repository with your code
- MySQL database (DigitalOcean Managed Database recommended)

### Steps

1. **Create MySQL Database**
   - Log in to DigitalOcean
   - Create → Databases → MySQL
   - Choose plan (Basic $15/month for starter)
   - Note connection details

2. **Create App**
   - Create → Apps → Deploy from GitHub
   - Select your repository
   - Configure:
     - Name: whatsapp-business-api
     - Branch: main
     - Autodeploy: Yes

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   DB_HOST=your-db-host
   DB_USER=doadmin
   DB_PASSWORD=your-db-password
   DB_NAME=whatsapp_business
   DB_PORT=25060
   WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   WHATSAPP_PHONE_NUMBER_ID=your_id
   WHATSAPP_ACCESS_TOKEN=your_token
   ... (add all variables from .env.example)
   ```

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment
   - Get your app URL: `https://your-app.ondigitalocean.app`

5. **Run Migrations**
   - Go to Console tab
   - Run: `npm run migrate`

6. **Update WhatsApp Webhook**
   - Use URL: `https://your-app.ondigitalocean.app/webhook`

### Estimated Cost
- Basic App: $5-12/month
- Managed MySQL: $15/month
- **Total: ~$20-27/month**

---

## Option 2: AWS EC2

### Prerequisites
- AWS account
- Domain name
- Basic Linux knowledge

### Steps

1. **Launch EC2 Instance**
   ```
   - AMI: Ubuntu 20.04 LTS
   - Instance Type: t2.small (1GB RAM minimum)
   - Storage: 20GB
   - Security Group: Allow ports 22, 80, 443, 3000
   ```

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install MySQL
   sudo apt install mysql-server -y
   sudo mysql_secure_installation

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install nginx -y

   # Install Git
   sudo apt install git -y
   ```

4. **Clone and Setup Application**
   ```bash
   cd /var/www
   git clone your-repository-url whatsapp-api
   cd whatsapp-api

   # Install dependencies
   npm install --production

   # Create .env file
   nano .env
   # Paste your environment variables

   # Run migrations
   npm run migrate

   # Build admin dashboard
   cd admin
   npm install
   npm run build
   cd ..
   ```

5. **Start Application with PM2**
   ```bash
   pm2 start src/server.js --name whatsapp-api
   pm2 start src/services/scheduler.js --name scheduler
   pm2 save
   pm2 startup
   # Run the command it provides
   ```

6. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/whatsapp-api
   ```

   Add:
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
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL Certificate**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

8. **Configure Auto-Restart**
   PM2 will automatically restart your app if it crashes.

### Estimated Cost
- EC2 t2.small: $15-20/month
- Domain: $10-15/year
- **Total: ~$15-20/month**

---

## Option 3: Heroku

### Prerequisites
- Heroku account
- Heroku CLI installed
- JawsDB MySQL addon or external database

### Steps

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Add MySQL Database**
   ```bash
   # Option 1: JawsDB (Free tier limited)
   heroku addons:create jawsdb

   # Option 2: Use external database (recommended)
   # Add DATABASE_URL to config vars
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set WHATSAPP_ACCESS_TOKEN=your_token
   # Set all other variables
   ```

5. **Create Procfile**
   ```bash
   echo "web: node src/server.js" > Procfile
   echo "scheduler: node src/services/scheduler.js" >> Procfile
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

7. **Run Migrations**
   ```bash
   heroku run npm run migrate
   ```

8. **Scale Dynos**
   ```bash
   heroku ps:scale web=1 scheduler=1
   ```

### Estimated Cost
- Basic Dyno: $7/month
- MySQL: $10-20/month
- **Total: ~$17-27/month**

---

## Option 4: Custom VPS (Linode, Vultr, etc.)

Similar to AWS EC2 setup. Follow EC2 steps with your VPS provider.

### Popular VPS Providers
- **Linode**: $5-10/month (1GB RAM)
- **Vultr**: $6/month (1GB RAM)
- **Hetzner**: €4/month (2GB RAM)

---

## Post-Deployment Checklist

### 1. Security

```bash
# Enable firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Keep system updated
sudo apt update && sudo apt upgrade -y
```

### 2. Database Backups

Setup automated backups:

```bash
# Create backup script
sudo nano /usr/local/bin/backup-whatsapp-db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u root -p'your_password' whatsapp_business | gzip > $BACKUP_DIR/whatsapp_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "whatsapp_*.sql.gz" -mtime +7 -delete

# Optional: Upload to S3
# aws s3 cp $BACKUP_DIR/whatsapp_$DATE.sql.gz s3://your-bucket/backups/
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/backup-whatsapp-db.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-whatsapp-db.sh
```

### 3. Monitoring

#### Setup PM2 Monitoring (Free)
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### Alternative: Use External Monitoring
- **Uptime Robot**: Free uptime monitoring
- **Sentry**: Error tracking
- **LogDNA**: Log management

### 4. Environment Variables Security

Never commit `.env` file to git:
```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
```

### 5. Database Connection Pooling

Already configured in `src/config/database.js`:
- Connection limit: 10
- Auto-reconnect enabled

### 6. Rate Limiting

WhatsApp has rate limits:
- **Tier 1**: 1,000 conversations/day
- **Tier 2**: 10,000 conversations/day
- **Tier 3**: 100,000 conversations/day

Our scheduler includes delays to avoid hitting limits.

---

## Scaling

### Horizontal Scaling

When you need to handle more traffic:

1. **Load Balancer Setup** (Nginx)
   ```nginx
   upstream whatsapp_api {
       server localhost:3001;
       server localhost:3002;
       server localhost:3003;
   }

   server {
       location / {
           proxy_pass http://whatsapp_api;
       }
   }
   ```

2. **Start Multiple Instances**
   ```bash
   PORT=3001 pm2 start src/server.js --name api-1
   PORT=3002 pm2 start src/server.js --name api-2
   PORT=3003 pm2 start src/server.js --name api-3
   ```

### Database Scaling

1. **Enable Query Caching** (MySQL)
2. **Add Read Replicas** for analytics queries
3. **Optimize Indexes** (already included in schema)

---

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/whatsapp-api
            git pull origin main
            npm install --production
            cd admin && npm install && npm run build && cd ..
            pm2 restart all
```

---

## Troubleshooting Production Issues

### Issue: High Memory Usage

```bash
# Check memory
free -h

# Increase PM2 max memory restart
pm2 start src/server.js --max-memory-restart 300M
```

### Issue: Database Connection Pool Exhausted

Increase pool size in `src/config/database.js`:
```javascript
connectionLimit: 20, // Increase from 10
```

### Issue: Webhook Timeouts

WhatsApp expects response in 20 seconds. Our webhook responds immediately (200) then processes async.

### Issue: SSL Certificate Renewal

Certbot auto-renews. Test:
```bash
sudo certbot renew --dry-run
```

---

## Monitoring Dashboard

Access PM2 monitoring:
```bash
pm2 monit
```

Access application logs:
```bash
pm2 logs whatsapp-api --lines 100
```

---

## Cost Optimization

### For Startups (<1000 messages/day)

**Recommended**: Linode/Vultr VPS
- VPS: $5/month
- Managed MySQL: $15/month
- Domain: $12/year
- **Total: ~$21/month**

### For Growing Business (1000-10000 messages/day)

**Recommended**: DigitalOcean
- App Platform: $12/month
- Database: $25/month
- Storage: $5/month
- **Total: ~$42/month**

### For Enterprise (>10000 messages/day)

**Recommended**: AWS
- EC2 t3.medium: $30/month
- RDS MySQL: $50/month
- Load Balancer: $20/month
- **Total: ~$100/month**

---

## Support & Maintenance

### Weekly Tasks
- [ ] Check error logs
- [ ] Review message delivery rates
- [ ] Monitor disk usage

### Monthly Tasks
- [ ] Update dependencies: `npm update`
- [ ] Review security updates
- [ ] Check database size
- [ ] Test backups

### Quarterly Tasks
- [ ] Performance optimization
- [ ] Review and update templates
- [ ] Audit security settings

---

## Getting Help

- Check logs: `pm2 logs`
- Database logs: `sudo tail -f /var/log/mysql/error.log`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Application logs: `tail -f logs/error.log`

---

**🎉 Your WhatsApp Business API is now deployed and ready for production!**

