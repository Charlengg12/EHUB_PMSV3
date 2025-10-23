#!/bin/bash

# Ehub Project Management Deployment Script

echo "🚀 Starting Ehub Project Management deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if environment file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found!"
    echo "📝 Please copy .env.example to .env.local and configure your Supabase credentials"
    echo ""
    echo "Required environment variables:"
    echo "- VITE_SUPABASE_URL"
    echo "- VITE_SUPABASE_ANON_KEY" 
    echo "- SUPABASE_SERVICE_ROLE_KEY"
    echo "- SUPABASE_DB_URL"
    echo ""
    read -p "Do you want to continue without environment file? (y/N): " continue_anyway
    if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Environment file found"
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "🔍 Supabase CLI found"
    read -p "Do you want to deploy Supabase Edge Functions? (y/N): " deploy_functions
    
    if [[ "$deploy_functions" =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying Supabase Edge Functions..."
        supabase functions deploy
        
        if [ $? -eq 0 ]; then
            echo "✅ Edge Functions deployed successfully"
        else
            echo "⚠️  Edge Functions deployment failed (you can deploy them manually later)"
        fi
    fi
else
    echo "⚠️  Supabase CLI not found. You can install it with: npm install -g supabase"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the 'dist' folder to your hosting provider:"
echo "   - Vercel: Connect your Git repository"
echo "   - Netlify: Upload the 'dist' folder or connect Git"
echo "   - VPS: Copy 'dist' contents to your web server"
echo ""
echo "2. Configure environment variables on your hosting platform"
echo ""
echo "3. Set up your Supabase project and deploy Edge Functions if not done already"
echo ""
echo "4. Access your application and login with your administrator credentials"
echo ""
echo "📚 For detailed instructions, see README.md"
echo ""
echo "✨ Happy project managing!"
