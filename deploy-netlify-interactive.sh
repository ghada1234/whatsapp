#!/bin/bash

echo "🚀 Deploying WhatsApp Admin Dashboard to Netlify"
echo "=================================================="
echo ""

cd /Users/ghadaalani/Desktop/new-proje/admin

# Check if build exists
if [ ! -d "build" ]; then
    echo "📦 Building the application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
else
    echo "✅ Build directory found"
fi

echo ""
echo "🔐 This will open your browser to authenticate with Netlify..."
echo "   Please follow these steps:"
echo ""
echo "   1. Login with your Netlify account (ghada1234)"
echo "   2. When asked 'What would you like to do?'"
echo "      → Choose: Create & configure a new project"
echo "   3. Team: ghada1234"
echo "   4. Site name: whatsapp-admin (or your choice)"
echo ""
read -p "Press Enter to continue..."

# Initialize and deploy
netlify deploy --prod

echo ""
echo "=================================================="
echo "🎉 Deployment Complete!"
echo ""
echo "Your admin dashboard should now be live!"
echo ""
echo "To check status: netlify status"
echo "To open site: netlify open:site"
echo "=================================================="

