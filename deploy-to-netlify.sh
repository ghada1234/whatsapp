#!/bin/bash

# WhatsApp Business API - Netlify Deployment Script
# This script deploys the admin dashboard to Netlify

echo "🚀 Deploying WhatsApp Admin Dashboard to Netlify..."
echo ""

# Check if we're in the right directory
if [ ! -d "admin" ]; then
    echo "❌ Error: admin directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Navigate to admin directory
cd admin

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create production environment file if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo "⚙️  Creating .env.production file..."
    echo "REACT_APP_API_URL=http://localhost:3000" > .env.production
    echo "⚠️  IMPORTANT: Update .env.production with your backend API URL!"
    echo "   Example: REACT_APP_API_URL=https://your-api.railway.app"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel and update the URL first..."
fi

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check if already initialized with Netlify
if [ ! -d ".netlify" ]; then
    echo "🌐 Initializing Netlify site..."
    netlify init
else
    echo "🌐 Netlify site already initialized"
fi

echo ""
echo "🚀 Deploying to Netlify..."
netlify deploy --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📱 Your admin dashboard is now live!"
    echo ""
    echo "Next steps:"
    echo "1. Note your Netlify URL"
    echo "2. Update backend CORS settings to allow your Netlify URL"
    echo "3. Update WhatsApp webhook if needed"
    echo ""
    echo "View your site: netlify open:site"
    echo "View deployment: netlify open:admin"
else
    echo "❌ Deployment failed!"
    exit 1
fi

