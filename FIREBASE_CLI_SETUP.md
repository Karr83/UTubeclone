# Firebase CLI Setup Guide

## ✅ Step 1: Login to Firebase

Open PowerShell in your project directory and run:

```powershell
cd "C:\Users\DELL\Desktop\MS GIFT PROJECT\ms-gift-project"
npm run firebase:login
```

This will:
- Open your browser
- Ask you to sign in with your Google account
- Authorize Firebase CLI

**OR** if you prefer, run directly:
```powershell
firebase login
```

---

## ✅ Step 2: Link Your Project

After logging in, link your Firebase project:

```powershell
npm run firebase:use
```

**OR** directly:
```powershell
firebase use social-vibing-karr
```

This links your local project to the Firebase project `social-vibing-karr`.

---

## ✅ Step 3: Verify Setup

Check that everything is connected:

```powershell
firebase projects:list
```

You should see `social-vibing-karr` in the list.

---

## 🚀 Now You Can Deploy!

### Deploy Firestore Rules Only:
```powershell
npm run firebase:deploy:rules
```

### Deploy Firestore Indexes Only:
```powershell
npm run firebase:deploy:indexes
```

### Deploy Both Rules and Indexes:
```powershell
npm run firebase:deploy:all
```

---

## 📋 Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm run firebase:login` | Login to Firebase |
| `npm run firebase:use` | Link to your project |
| `npm run firebase:deploy:rules` | Deploy security rules |
| `npm run firebase:deploy:indexes` | Deploy indexes |
| `npm run firebase:deploy:all` | Deploy both |

---

## 🔧 Direct Firebase CLI Commands

If you prefer using Firebase CLI directly:

```powershell
# Login
firebase login

# Use project
firebase use social-vibing-karr

# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy both
firebase deploy --only firestore
```

---

## ⚠️ Important Notes

1. **First Time Setup**: You only need to login and link the project once
2. **Deployment Time**: Rules deploy instantly, indexes take 5-10 minutes to build
3. **Check Status**: Visit [Firebase Console](https://console.firebase.google.com/project/social-vibing-karr/firestore/indexes) to see index build status
4. **After Deployment**: Clear your app cache: `npx expo start --clear`

---

## 🎯 Typical Workflow

1. **Make changes** to `firestore.rules` or `firestore.indexes.json`
2. **Deploy**: `npm run firebase:deploy:all`
3. **Wait** for indexes to build (5-10 min)
4. **Test** in your app

---

## ❓ Troubleshooting

### "Not logged in" error
```powershell
npm run firebase:login
```

### "Project not found" error
```powershell
npm run firebase:use
```

### "firebase.json not found" error
✅ Already created! The file exists at `ms-gift-project/firebase.json`

---

## 📁 Project Structure

```
ms-gift-project/
├── firebase.json          ← Firebase config (already created)
├── firestore.rules        ← Security rules
├── firestore.indexes.json ← Index definitions
└── package.json           ← Added deployment scripts
```

---

**You're all set!** 🎉 Just login and link, then you can deploy anytime!
