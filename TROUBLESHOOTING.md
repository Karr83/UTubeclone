# Troubleshooting Guide - UI Not Showing

## 🔍 Quick Diagnosis Steps

### Step 1: Check Expo Server
```powershell
cd "C:\Users\DELL\Desktop\MS GIFT PROJECT\ms-gift-project"
npm start -- --clear
```

**Look for:**
- ✅ "Metro waiting on exp://..."
- ✅ QR code displayed
- ❌ Any red error messages

### Step 2: Check Console Logs
In your Expo Go app or terminal, look for:
- ✅ "🎭 DEMO MODE ACTIVE - Using mock user"
- ✅ "⚠️ Firebase offline, using mock data"
- ❌ Red error messages

### Step 3: Verify App Structure
The app should:
1. Show loading screen briefly
2. Navigate to UserNavigator (bottom tabs)
3. Display Home tab with video feed

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot read property 'semantic' of undefined"
**Status:** ✅ FIXED
- `darkTheme` is now properly exported from `theme/index.js`

### Issue 2: Firebase Errors
**Status:** ✅ FIXED
- All services check for Firebase before use
- Mock data displays when Firebase is offline

### Issue 3: Empty Screens / No Content
**Possible Causes:**
1. Mock data not loading
2. Component not rendering
3. Navigation issue

**Check:**
- Open Home tab - should see 5 videos
- Open Library tab - should see 5 recordings
- Open Live tab - should see 3 streams

### Issue 4: Components Not Visible
**Check These Files:**
- `src/components/video/VideoCard.tsx` - Should render thumbnails
- `src/components/icons/navigation/NavigationIcon.tsx` - Should render icons
- `src/screens/shared/ContentFeedScreen.tsx` - Should use VideoCard

## ✅ Verification Checklist

### Components Working:
- [ ] NavigationIcon shows in bottom tabs (not emojis)
- [ ] VideoCard shows in Home feed
- [ ] VideoCard shows in Library
- [ ] VideoCard shows in Live tab
- [ ] UserAvatar shows in Profile
- [ ] TopMenuIcon shows in Home header

### Data Displaying:
- [ ] Home: 5 videos visible
- [ ] Library: 5 recordings visible
- [ ] Live: 3 streams visible
- [ ] Profile: User info visible

### Styling:
- [ ] Dark theme throughout
- [ ] YouTube-style colors
- [ ] Proper spacing and typography

## 🔧 Manual Verification

### Test Each Screen:

1. **Home Tab:**
   - Should show "MS GIFT" header
   - Should show search and notification icons
   - Should show filter chips (All, Public, Members)
   - Should show 5 video cards with thumbnails

2. **Library Tab:**
   - Should show "Library" header
   - Should show sort chips (Recent, Popular)
   - Should show 5 recording cards

3. **Live Tab:**
   - Should show "Live" header with red dot
   - Should show filter chips
   - Should show 3 live stream cards

4. **Profile Tab:**
   - Should show UserAvatar (circular with initial)
   - Should show email and role badge
   - Should show membership section

## 🚨 If Nothing Works

### Nuclear Option - Full Reset:
```powershell
cd "C:\Users\DELL\Desktop\MS GIFT PROJECT\ms-gift-project"
# Kill all Node processes
taskkill /F /IM node.exe
# Clear cache
npm start -- --clear
```

### Check These Files Exist:
- ✅ `App.tsx` - Root component
- ✅ `src/navigation/RootNavigator.tsx` - Main navigator
- ✅ `src/navigation/stacks/UserNavigator.tsx` - User tabs
- ✅ `src/screens/shared/ContentFeedScreen.tsx` - Home screen
- ✅ `src/components/video/VideoCard.tsx` - Video card component

### Verify Imports:
All screens should import from:
- `../../components/video` for VideoCard
- `../../components/icons/navigation` for NavigationIcon
- `../../theme` for darkTheme

## 📞 Still Not Working?

**Share these details:**
1. Screenshot of what you see
2. Terminal output (errors)
3. Which screen you're on
4. What you expected to see

**All UI components are implemented and should be working!**
