#!/bin/bash

echo "🚀 Push WhatsApp Business API to GitHub"
echo ""

# Check if GitHub username is provided
if [ -z "$1" ]; then
    echo "Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "Example: ./push-to-github.sh ghada1234"
    echo ""
    echo "Or manually run:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/whatsapp-business-api.git"
    echo "  git push -u origin main"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_URL="https://github.com/${GITHUB_USERNAME}/whatsapp-business-api.git"

echo "GitHub Username: ${GITHUB_USERNAME}"
echo "Repository URL: ${REPO_URL}"
echo ""

# Check if repository was created on GitHub
echo "⚠️  Make sure you've created the repository on GitHub first!"
echo "   Go to: https://github.com/new"
echo "   Repository name: whatsapp-business-api"
echo ""
read -p "Have you created the repository on GitHub? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the repository first at https://github.com/new"
    exit 1
fi

echo ""
echo "📤 Adding remote and pushing to GitHub..."
echo ""

# Add remote
git remote add origin "$REPO_URL"

if [ $? -ne 0 ]; then
    echo "⚠️  Remote might already exist. Trying to set URL instead..."
    git remote set-url origin "$REPO_URL"
fi

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code is now on GitHub!"
    echo ""
    echo "🔗 Repository: https://github.com/${GITHUB_USERNAME}/whatsapp-business-api"
    echo ""
    echo "Next steps:"
    echo "1. Deploy admin dashboard to Netlify: https://app.netlify.com/teams/ghada1234"
    echo "2. Deploy backend to Railway: https://railway.app"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Repository exists on GitHub"
    echo "2. You have access to the repository"
    echo "3. Your GitHub credentials are configured"
    echo ""
    echo "Try running: git push -u origin main"
fi

