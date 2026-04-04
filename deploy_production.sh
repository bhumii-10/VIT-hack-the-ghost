#!/bin/bash

# SankatSaathi Production Deployment Script
# This script sets up and deploys the complete SankatSaathi system

echo "🚨 SankatSaathi Production Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_header "Checking Requirements"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Python
    if command -v python &> /dev/null; then
        PYTHON_VERSION=$(python --version)
        print_status "Python found: $PYTHON_VERSION"
    else
        print_error "Python is not installed. Please install Python 3.9+ first."
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check pip
    if command -v pip &> /dev/null; then
        PIP_VERSION=$(pip --version)
        print_status "pip found: $PIP_VERSION"
    else
        print_error "pip is not installed. Please install pip first."
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_header "Setting up Backend"
    
    cd backend
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Copying from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please configure your environment variables in backend/.env"
        else
            print_error ".env.example not found. Please create backend/.env manually."
        fi
    else
        print_status "Backend .env file found"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_header "Setting up Frontend"
    
    cd frontend
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating default..."
        echo "VITE_SUPABASE_URL=your_supabase_url" > .env
        echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env
        echo "VITE_API_URL=http://localhost:8000" >> .env
        print_warning "Please configure your environment variables in frontend/.env"
    else
        print_status "Frontend .env file found"
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production file not found. Creating default..."
        echo "VITE_SUPABASE_URL=your_supabase_url" > .env.production
        echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.production
        echo "VITE_API_URL=https://your-backend-domain.vercel.app" >> .env.production
        print_warning "Please configure your production environment variables in frontend/.env.production"
    else
        print_status "Frontend .env.production file found"
    fi
    
    cd ..
}

# Test backend
test_backend() {
    print_header "Testing Backend"
    
    cd backend
    
    # Test import
    print_status "Testing backend imports..."
    python -c "import app; print('✅ Backend imports successfully')" || {
        print_error "Backend import test failed"
        cd ..
        return 1
    }
    
    cd ..
    print_status "Backend test passed"
}

# Build frontend
build_frontend() {
    print_header "Building Frontend"
    
    cd frontend
    
    # Build for production
    print_status "Building frontend for production..."
    npm run build || {
        print_error "Frontend build failed"
        cd ..
        return 1
    }
    
    cd ..
    print_status "Frontend build completed"
}

# Deploy to Vercel (if vercel CLI is available)
deploy_vercel() {
    print_header "Deploying to Vercel"
    
    if command -v vercel &> /dev/null; then
        print_status "Vercel CLI found. Deploying..."
        vercel --prod || {
            print_warning "Vercel deployment failed. Please deploy manually."
            return 1
        }
        print_status "Deployment to Vercel completed"
    else
        print_warning "Vercel CLI not found. Please install with: npm i -g vercel"
        print_status "Manual deployment steps:"
        echo "1. Install Vercel CLI: npm i -g vercel"
        echo "2. Login to Vercel: vercel login"
        echo "3. Deploy: vercel --prod"
    fi
}

# Start local development servers
start_local() {
    print_header "Starting Local Development Servers"
    
    print_status "Starting backend server..."
    cd backend
    python app.py &
    BACKEND_PID=$!
    cd ..
    
    sleep 3
    
    print_status "Starting frontend server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_status "🚀 Servers started!"
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:5173"
    echo "Admin Dashboard: http://localhost:5173 (login with admin@sankatsaathi.com / SankatSaathi@2024)"
    echo ""
    echo "Press Ctrl+C to stop servers"
    
    # Wait for user interrupt
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
}

# Main deployment function
main() {
    echo "Select deployment option:"
    echo "1. Full setup and local development"
    echo "2. Setup only (no server start)"
    echo "3. Build for production"
    echo "4. Deploy to Vercel"
    echo "5. Start local servers only"
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            check_requirements
            setup_backend
            setup_frontend
            test_backend
            start_local
            ;;
        2)
            check_requirements
            setup_backend
            setup_frontend
            test_backend
            print_status "Setup completed. Run './deploy_production.sh' and choose option 5 to start servers."
            ;;
        3)
            check_requirements
            setup_backend
            setup_frontend
            test_backend
            build_frontend
            print_status "Production build completed. Deploy the dist/ folder to your hosting service."
            ;;
        4)
            check_requirements
            setup_backend
            setup_frontend
            test_backend
            build_frontend
            deploy_vercel
            ;;
        5)
            start_local
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
}

# Run main function
main