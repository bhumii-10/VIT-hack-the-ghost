# 🚀 Complete Deployment Guide - Render + Vercel

## Architecture
- **Backend**: Render (https://sankatsaathi.onrender.com)
- **Frontend**: Vercel (https://sankat-saathi.vercel.app)

## 1. Render Backend Setup

### Environment Variables (Add in Render Dashboard)
```
SUPABASE_URL=https://wmjqgcgamnbbqkbooovb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtanFnY2dhbW5iYnFrYm9vb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzQzNjEsImV4cCI6MjA4MzYxMDM2MX0.jqAvXPCbey3E7cqVczpghgdus44WaqBJbJLovtdHpGo
VAPID_PUBLIC_KEY=BG7glQYOmQgTWYNlK5Kxrr40QdVZPMSEJpjuV5PNnRQr7xjWtv2N-h81CxzOKti9yEdKkGFmgaUxnQiyuhgt53c
VAPID_PRIVATE_KEY=ZIGO7NVEWyXc5bUlkiQHUzXcVph1DrH_35PER48XEzE
VAPID_MAILTO=mailto:bingostingo1@gmail.com
GEMINI_API_KEY=AIzaSyALkD2_ii0EH8UTa9O0xBpW62FM_BYhKOM
PYTHONPATH=backend
PORT=10000
```

### Service Configuration
- **Build Command**: `cd backend && pip install -r requirements.txt`
- **Start Command**: `cd backend && python app.py`
- **Python Version**: 3.11 (not 3.13)

## 2. Vercel Frontend Setup

### Environment Variables (Add in Vercel Dashboard)
```
VITE_SUPABASE_URL=https://wmjqgcgamnbbqkbooovb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtanFnY2dhbW5iYnFrYm9vb3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzQzNjEsImV4cCI6MjA4MzYxMDM2MX0.jqAvXPCbey3E7cqVczpghgdus44WaqBJbJLovtdHpGo
VITE_VAPID_PUBLIC_KEY=BG7glQYOmQgTWYNlK5Kxrr40QdVZPMSEJpjuV5PNnRQr7xjWtv2N-h81CxzOKti9yEdKkGFmgaUxnQiyuhgt53c
VITE_API_URL=https://sankatsaathi.onrender.com/api
```

## 3. Deployment Steps

### Step 1: Deploy Backend to Render
1. Go to https://dashboard.render.com/
2. Create new Web Service
3. Connect your GitHub repository
4. Set build/start commands as above
5. Add all environment variables
6. Deploy

### Step 2: Deploy Frontend to Vercel
1. Go to https://vercel.com/dashboard
2. Import your GitHub repository
3. Set framework preset to "Vite"
4. Add all environment variables
5. Deploy

## 4. Testing Deployment

### Backend Health Check
```bash
curl https://sankatsaathi.onrender.com/
curl https://sankatsaathi.onrender.com/api/health
```

### Frontend Check
- Visit: https://sankat-saathi.vercel.app/landing
- Check browser console for API connection
- Test login with: admin@sankatsaathi.com / SankatSaathi@2024

## 5. Troubleshooting

### Backend Issues
- Check Render logs for Python/dependency errors
- Ensure Python 3.11 is selected (not 3.13)
- Verify all environment variables are set

### Frontend Issues
- Check Vercel function logs
- Verify VITE_API_URL points to Render backend
- Check browser console for CORS errors

## 6. URLs After Deployment
- **Frontend**: https://sankat-saathi.vercel.app
- **Backend**: https://sankatsaathi.onrender.com
- **API Base**: https://sankatsaathi.onrender.com/api

## 7. Features Available
✅ Crisis Management Dashboard
✅ ML Hotspot Engine with Heatmaps  
✅ Live News Aggregation
✅ Emergency Broadcasting
✅ 3D Earth Visualization
✅ Admin Dashboard
✅ Push Notifications
✅ Multi-language Support