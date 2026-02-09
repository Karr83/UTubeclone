# Firebase CLI Setup Script
# This script will guide you through Firebase setup

Write-Host "`n🔥 Firebase CLI Setup`n" -ForegroundColor Cyan
Write-Host "Step 1: Logging in to Firebase..." -ForegroundColor Yellow
Write-Host "A browser window will open. Please sign in with your Google account.`n" -ForegroundColor White

# Try to login
firebase login

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Login successful!`n" -ForegroundColor Green
    
    Write-Host "Step 2: Linking project..." -ForegroundColor Yellow
    firebase use social-vibing-karr
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Project linked!`n" -ForegroundColor Green
        
        Write-Host "Step 3: Deploying Firestore rules and indexes...`n" -ForegroundColor Yellow
        firebase deploy --only firestore
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Deployment complete!`n" -ForegroundColor Green
            Write-Host "📝 Note: Indexes may take 5-10 minutes to build." -ForegroundColor Cyan
            Write-Host "   Check status at: https://console.firebase.google.com/project/social-vibing-karr/firestore/indexes`n" -ForegroundColor Cyan
        } else {
            Write-Host "`n❌ Deployment failed. Check the error above.`n" -ForegroundColor Red
        }
    } else {
        Write-Host "`n❌ Failed to link project. Check the error above.`n" -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ Login failed. Please try running 'firebase login' manually.`n" -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
