# Deploy Script for SankatSaathi

Write-Host "Preparing for Deployment..." -ForegroundColor Cyan

# 1. Check Vercel Login Status
Write-Host "Checking Vercel authentication..."
try {
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Not logged in. Launching login flow..." -ForegroundColor Yellow
        vercel login
    } else {
        Write-Host "Logged in as: $whoami" -ForegroundColor Green
    }
} catch {
    Write-Host "Vercel CLI error. Attempting login..." -ForegroundColor Yellow
    vercel login
}

# 2. Deploy to Production
Write-Host ""
Write-Host "Starting Production Deployment..." -ForegroundColor Cyan
Write-Host "This will build and deploy your application to Vercel."
vercel --prod

Write-Host ""
Write-Host "If deployment succeeded, your app is live!" -ForegroundColor Green
Read-Host "Press Enter to exit"
