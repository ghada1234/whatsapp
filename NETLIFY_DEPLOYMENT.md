# Deploying to Netlify

This guide explains how to deploy the WhatsApp Business API system with Netlify for the frontend.

## Architecture Overview

Since this is a full-stack application, we'll split the deployment:

```
┌─────────────────┐
│   NETLIFY       │  ← React Admin Dashboard (Static)
│  (Frontend)     │
└────────┬────────┘
         │ API Calls
         ↓
┌─────────────────┐
│  HEROKU/RENDER  │  ← Node.js Backend + MySQL + Scheduler
│  (Backend)      │
└─────────────────┘
```

## Part 1: Deploy Backend First

The backend (API, database, scheduler) **cannot** run on Netlify. Choose one:

### Option A: Railway (Recommended - Easiest)

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add MySQL Database**
   - Click "New" → "Database" → "Add MySQL"
   - Copy connection details

4. **Configure Environment Variables**
   - Go to your service → Variables
   - Add all variables from `.env`:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<from railway mysql>
   DB_USER=<from railway mysql>
   DB_PASSWORD=<from railway mysql>
   DB_NAME=railway
   WHATSAPP_API_URL=https://graph.facebook.com/v18.0
   WHATSAPP_PHONE_NUMBER_ID=your_id
   WHATSAPP_ACCESS_TOKEN=your_token
   ... (all other variables)
   ```

5. **Deploy**
   - Railway auto-deploys
   - Get your backend URL: `https://your-app.railway.app`

6. **Run Migrations**
   - Go to your service
   - Open terminal
   - Run: `npm run migrate`

**Cost**: $5/month (includes database)

### Option B: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create App**
   ```bash
   cd /Users/ghadaalani/Desktop/new-proje
   heroku create your-whatsapp-api
   ```

3. **Add MySQL**
   ```bash
   heroku addons:create jawsdb
   # Or use external database like PlanetScale
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set WHATSAPP_ACCESS_TOKEN=your_token
   heroku config:set WHATSAPP_PHONE_NUMBER_ID=your_id
   # ... set all variables
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. **Run Migrations**
   ```bash
   heroku run npm run migrate
   ```

**Cost**: $7-10/month

### Option C: Render

Similar to Railway but with free tier (limited).

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Add PostgreSQL or external MySQL
5. Deploy

## Part 2: Deploy Frontend to Netlify

Now that your backend is running, let's deploy the admin dashboard to Netlify!

### Step 1: Prepare Admin Dashboard

```bash
cd /Users/ghadaalani/Desktop/new-proje/admin

# Create .env.production
echo "REACT_APP_API_URL=https://your-backend-api.railway.app" > .env.production

# Test build locally
npm run build
```

### Step 2: Deploy to Netlify

#### Method A: Netlify CLI (Fastest)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
cd /Users/ghadaalani/Desktop/new-proje/admin
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Team: ghada1234
# - Site name: whatsapp-admin (or your choice)
# - Build command: npm run build
# - Publish directory: build

# Deploy
netlify deploy --prod
```

Your site will be live at: `https://whatsapp-admin.netlify.app`

#### Method B: Netlify Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   cd /Users/ghadaalani/Desktop/new-proje
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/whatsapp-api.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/teams/ghada1234
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select your repository
   - Configure:
     ```
     Base directory: admin
     Build command: npm run build
     Publish directory: admin/build
     ```

3. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
     ```
     REACT_APP_API_URL = https://your-backend-api.railway.app
     ```

4. **Deploy**
   - Click "Deploy site"
   - Wait 2-3 minutes
   - Your site will be live!

### Step 3: Update Backend CORS

Update your backend to allow requests from Netlify:

```bash
# In your backend .env or Railway variables, add:
FRONTEND_URL=https://your-site.netlify.app
```

Then update `src/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    'https://your-site.netlify.app'
  ],
  credentials: true
}));
```

Redeploy backend.

### Step 4: Test Everything

1. Open your Netlify URL: `https://your-site.netlify.app`
2. Dashboard should load
3. Try uploading customers
4. Create a test campaign
5. Check analytics

## Complete Deployment Checklist

### Backend (Railway/Heroku)
- [ ] Backend deployed and running
- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Scheduler service running
- [ ] Backend URL noted

### Frontend (Netlify)
- [ ] Admin dashboard built successfully
- [ ] Deployed to Netlify
- [ ] Environment variables set (REACT_APP_API_URL)
- [ ] Site accessible via Netlify URL
- [ ] API calls working

### Integration
- [ ] CORS configured on backend
- [ ] WhatsApp webhook updated
- [ ] Test campaign sent successfully
- [ ] Analytics tracking correctly

## Custom Domain (Optional)

### For Netlify (Frontend)
1. Go to Site settings → Domain management
2. Add custom domain: `admin.yourdomain.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: admin
   Value: your-site.netlify.app
   ```

### For Backend
Configure custom domain in Railway/Heroku settings.

## Cost Breakdown

### Minimal Setup
- Railway (Backend + DB): $5/month
- Netlify (Frontend): Free
- **Total: $5/month**

### Production Setup
- Railway Pro: $20/month
- Managed MySQL: $15/month
- Netlify Pro: $19/month
- **Total: $54/month**

## Troubleshooting

### Frontend shows "Network Error"
- Check `REACT_APP_API_URL` is correct
- Verify backend is running
- Check browser console for CORS errors

### CORS Error
- Add Netlify URL to backend CORS config
- Redeploy backend

### API calls fail with 404
- Ensure API routes start with `/api/`
- Check `netlify.toml` proxy settings

### Build fails on Netlify
```bash
# Test build locally first
cd admin
npm run build

# If successful, commit and push
```

## Monitoring

### Backend Logs
```bash
# Railway
railway logs

# Heroku
heroku logs --tail
```

### Netlify Logs
- Go to Deploys → Deploy log
- Check Function logs for any errors

## Updates & Redeployment

### Update Frontend
```bash
cd admin
# Make changes
git add .
git commit -m "Update frontend"
git push origin main
# Netlify auto-deploys
```

### Update Backend
```bash
# Make changes
git add .
git commit -m "Update backend"
git push origin main
# Railway/Heroku auto-deploys
```

## Success! 🎉

Your WhatsApp Business API is now live:
- **Admin Dashboard**: https://your-site.netlify.app
- **Backend API**: https://your-api.railway.app
- **Database**: Managed MySQL

## Quick Deploy Commands

```bash
# Frontend (Netlify)
cd admin
netlify deploy --prod

# Backend (Railway)
railway up

# Backend (Heroku)
git push heroku main
```

---

**Need Help?**
- Netlify Status: Check https://netlifystatus.com
- Railway Docs: https://docs.railway.app
- Heroku Docs: https://devcenter.heroku.com

