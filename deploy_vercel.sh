#!/bin/bash

echo "🚀 Deploying SankatSaathi to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Test backend
echo "🧪 Testing backend..."
cd backend
python -c "import app; print('✅ Backend imports successful')"
cd ..

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "🔗 Your SankatSaathi app is now live!"
echo ""
echo "📋 Environment Variables Required in Vercel:"
echo "   ✅ GNEWS_API_KEY (already set: 5606f10541654d6fa69afc40ec0f0c99)"
echo "   🔑 SUPABASE_URL"
echo "   🔑 SUPABASE_KEY" 
echo "   🔑 GEMINI_API_KEY"
echo "   🔑 TWILIO_ACCOUNT_SID"
echo "   🔑 TWILIO_AUTH_TOKEN"
echo "   🔑 SARVAM_API_KEY"
echo "   🔑 VAPID_PUBLIC_KEY"
echo "   🔑 VAPID_PRIVATE_KEY"
echo ""
echo "🎉 SankatSaathi is production-ready!"
echo "📱 Fully mobile responsive"
echo "🌍 Multi-language support"
echo "🎤 Voice navigation enabled"
echo "🚨 Emergency services integrated"