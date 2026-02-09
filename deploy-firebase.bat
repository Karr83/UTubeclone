@echo off
echo.
echo ========================================
echo   Firebase Deployment Script
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Logging in to Firebase...
echo A browser window will open. Please sign in with your Google account.
echo.
firebase login

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Login failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Linking project to social-vibing-karr...
echo.
firebase use social-vibing-karr

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to link project!
    pause
    exit /b 1
)

echo.
echo Step 3: Deploying Firestore rules and indexes...
echo.
firebase deploy --only firestore

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Deployment Complete!
    echo ========================================
    echo.
    echo Note: Indexes may take 5-10 minutes to build.
    echo Check status at:
    echo https://console.firebase.google.com/project/social-vibing-karr/firestore/indexes
    echo.
) else (
    echo.
    echo ERROR: Deployment failed!
    echo.
)

pause
