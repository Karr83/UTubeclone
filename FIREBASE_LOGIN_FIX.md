# Fixing Firebase Login 400 Error

## 🔧 Solution 1: Update and Retry (Recommended)

The Firebase CLI has been updated. Try logging in again:

```powershell
cd "C:\Users\DELL\Desktop\MS GIFT PROJECT\ms-gift-project"
firebase login
```

---

## 🔧 Solution 2: Clear Firebase Cache

If you still get the 400 error, clear the Firebase cache:

```powershell
# Clear Firebase cache
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\firebase" -ErrorAction SilentlyContinue

# Try login again
firebase login
```

---

## 🔧 Solution 3: Use Manual Token Login

If browser login keeps failing, use manual token:

```powershell
firebase login:ci
```

This will:
1. Give you a URL to visit
2. You'll get a token
3. Paste the token back

---

## 🔧 Solution 4: Check Network/Proxy

The 400 error can be caused by:
- Corporate firewall/proxy
- VPN blocking OAuth
- Antivirus interfering

**Try:**
1. Disable VPN temporarily
2. Check if you're behind a corporate proxy
3. Try from a different network (mobile hotspot)

---

## 🔧 Solution 5: Use Firebase Console Directly (No CLI Needed!)

If CLI login keeps failing, you can deploy directly from Firebase Console:

### Deploy Rules:
1. Go to: https://console.firebase.google.com/project/social-vibing-karr/firestore/rules
2. Copy contents of `firestore.rules`
3. Paste into the editor
4. Click **"Publish"**

### Deploy Indexes:
1. Go to: https://console.firebase.google.com/project/social-vibing-karr/firestore/indexes
2. Click **"Create Index"**
3. Follow the instructions in `CREATE_INDEXES_MANUAL.md`

---

## ✅ After Successful Login

Once logged in, run:

```powershell
# Link project
firebase use social-vibing-karr

# Deploy everything
firebase deploy --only firestore
```

---

## 🆘 Still Having Issues?

If nothing works, you can:
1. **Deploy rules manually** via Firebase Console (see Solution 5)
2. **Create indexes manually** when you see the error links in your app
3. The app will work fine - you just won't have automated deployments

The app functionality doesn't depend on Firebase CLI - it's just for convenience!
