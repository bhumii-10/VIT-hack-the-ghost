# SankatSaathi Production Deployment Script (PowerShell)
# This script sets up and deploys the complete SankatSaathi system

Write-Host "🚨 SankatSaathi Production Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param($Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

# Check if required tools are installed
function Check-Requirements {
    Write-Header "Checking Requirements"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Status "Node.js found: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    }
    
    # Check Python
    try {
        $pythonVersion = python --version
        Write-Status "Python found: $pythonVersion"
    }
    catch {
        Write-Error "Python is not installed. Please install Python 3.9+ first."
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Status "npm found: $npmVersion"
    }
    catch {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
    
    # Check pip
    try {
        $pipVersion = pip --version
        Write-Status "pip found: $pipVersion"
    }
    catch {
        Write-Error "pip is not installed. Please install pip first."
        exit 1
    }
}

# Setup backend
function Setup-Backend {
    Write-Header "Setting up Backend"
    
    Set-Location backend
    
    # Install Python dependencies
    Write-Status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Check if .env exists
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found."
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Warning "Copied .env.example to .env. Please configure your environment variables."
        }
        else {
            Write-Error ".env.example not found. Please create backend/.env manually."
        }
    }
    else {
        Write-Status "Backend .env file found"
    }
    
    Set-Location ..
}

# Setup frontend
function Setup-Frontend {
    Write-Header "Setting up Frontend"
    
    Set-Location frontend
    
    # Install Node.js dependencies
    Write-Status "Installing Node.js dependencies..."
    npm install
    
    # Check if .env exists
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found. Creating default..."
        @"
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Warning "Please configure your environment variables in frontend/.env"
    }
    else {
        Write-Status "Frontend .env file found"
    }
    
    # Check if .env.production exists
    if (-not (Test-Path ".env.production")) {
        Write-Warning ".env.production file not found. Creating default..."
        @"
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-backend-domain.vercel.app
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
        Write-Warning "Please configure your production environment variables in frontend/.env.production"
    }
    else {
        Write-Status "Frontend .env.production file found"
    }
    
    Set-Location ..
}

# Test backend
function Test-Backend {
    Write-Header "Testing Backend"
    
    Set-Location backend
    
    # Test import
    Write-Status "Testing backend imports..."
    try {
        python -c "import app; print('✅ Backend imports successfully')"
        Write-Status "Backend test passed"
    }
    catch {
        Write-Error "Backend import test failed"
        Set-Location ..
        return $false
    }
    
    Set-Location ..
    return $true
}

# Build frontend
function Build-Frontend {
    Write-Header "Building Frontend"
    
    Set-Location frontend
    
    # Build for production
    Write-Status "Building frontend for production..."
    try {
        npm run build
        Write-Status "Frontend build completed"
    }
    catch {
        Write-Error "Frontend build failed"
        Set-Location ..
        return $false
    }
    
    Set-Location ..
    return $true
}

# Deploy to Vercel
function Deploy-Vercel {
    Write-Header "Deploying to Vercel"
    
    try {
        $vercelVersion = vercel --version
        Write-Status "Vercel CLI found: $vercelVersion"
        Write-Status "Deploying to Vercel..."
        vercel --prod
        Write-Status "Deployment to Vercel completed"
    }
    catch {
        Write-Warning "Vercel CLI not found. Please install with: npm i -g vercel"
        Write-Status "Manual deployment steps:"
        Write-Host "1. Install Vercel CLI: npm i -g vercel"
        Write-Host "2. Login to Vercel: vercel login"
        Write-Host "3. Deploy: vercel --prod"
    }
}

# Start local development servers
function Start-Local {
    Write-Header "Starting Local Development Servers"
    
    Write-Status "Starting backend server..."
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        python app.py
    }
    
    Start-Sleep -Seconds 3
    
    Write-Status "Starting frontend server..."
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\frontend
        npm run dev
    }
    
    Write-Status "🚀 Servers started!"
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Admin Dashboard: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Admin Login: admin@sankatsaathi.com / SankatSaathi@2024" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop servers" -ForegroundColor Yellow
    
    try {
        # Wait for user interrupt
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    finally {
        Write-Status "Stopping servers..."
        Stop-Job $backendJob, $frontendJob
        Remove-Job $backendJob, $frontendJob
    }
}

# Main deployment function
function Main {
    Write-Host "Select deployment option:" -ForegroundColor Cyan
    Write-Host "1. Full setup and local development"
    Write-Host "2. Setup only (no server start)"
    Write-Host "3. Build for production"
    Write-Host "4. Deploy to Vercel"
    Write-Host "5. Start local servers only"
    
    $choice = Read-Host "Enter your choice (1-5)"
    
    switch ($choice) {
        "1" {
            Check-Requirements
            Setup-Backend
            Setup-Frontend
            if (Test-Backend) {
                Start-Local
            }
        }
        "2" {
            Check-Requirements
            Setup-Backend
            Setup-Frontend
            if (Test-Backend) {
                Write-Status "Setup completed. Run './deploy_production.ps1' and choose option 5 to start servers."
            }
        }
        "3" {
            Check-Requirements
            Setup-Backend
            Setup-Frontend
            if (Test-Backend) {
                if (Build-Frontend) {
                    Write-Status "Production build completed. Deploy the dist/ folder to your hosting service."
                }
            }
        }
        "4" {
            Check-Requirements
            Setup-Backend
            Setup-Frontend
            if (Test-Backend) {
                if (Build-Frontend) {
                    Deploy-Vercel
                }
            }
        }
        "5" {
            Start-Local
        }
        default {
            Write-Error "Invalid choice. Please run the script again."
            exit 1
        }
    }
}

# Run main function
Main