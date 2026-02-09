# Firestore Indexes Setup Guide

## Quick Setup

The `firestore.indexes.json` file contains all required composite indexes for your app. You need to deploy these indexes to Firebase.

### Option 1: Deploy via Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   cd ms-gift-project
   firebase init firestore
   ```
   - Select "Use an existing project"
   - Choose `social-vibing-karr`
   - When asked about indexes, say "Yes" and point to `firestore.indexes.json`

4. **Deploy indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Option 2: Create Indexes Manually in Firebase Console

1. **Go to Firebase Console**:
   - Navigate to: https://console.firebase.google.com/project/social-vibing-karr/firestore/indexes

2. **Click "Create Index"** for each index below

3. **Copy the index configuration** from `firestore.indexes.json`

## Required Indexes

### Content Collection Indexes

1. **Boosted Content Query**:
   - Fields: `isBoosted` (ASC), `status` (ASC), `boostLevel` (DESC), `boostedAt` (DESC)

2. **Feed Query**:
   - Fields: `status` (ASC), `isBoosted` (ASC), `createdAt` (DESC)

### Recordings Collection Indexes

1. **Public Recordings Query** (Most Common):
   - Fields: `status` (ASC), `visibility` (ASC), `isDeleted` (ASC), `isHidden` (ASC), `createdAt` (DESC)
   - **This is the one causing your error!**

2. **Creator Recordings Query**:
   - Fields: `creatorId` (ASC), `isDeleted` (ASC), `createdAt` (DESC)

3. **Creator Recordings with Status**:
   - Fields: `creatorId` (ASC), `status` (ASC), `isDeleted` (ASC), `createdAt` (DESC)

4. **All Recordings Query**:
   - Fields: `status` (ASC), `isDeleted` (ASC), `createdAt` (DESC)

### Streams Collection Indexes

1. **Live Streams with Visibility**:
   - Fields: `status` (ASC), `visibility` (ASC), `isSuspended` (ASC), `viewerCount` (DESC)

2. **Live Streams Query**:
   - Fields: `status` (ASC), `isSuspended` (ASC), `viewerCount` (DESC)

## Index Creation Time

⚠️ **Important**: Indexes can take **5-10 minutes** to build, especially if you have existing data.

You can check the status in Firebase Console → Firestore → Indexes tab.

## Troubleshooting

### Still Getting Index Errors?

1. **Check Index Status**:
   - Go to Firebase Console → Firestore → Indexes
   - Look for indexes marked as "Building" or "Error"
   - Wait for them to complete (green checkmark)

2. **Verify Index Configuration**:
   - Make sure field names match exactly (case-sensitive)
   - Check that order (ASC/DESC) matches your queries

3. **Check Error Message**:
   - The error message usually includes a link to create the index
   - Click the link to auto-create the index

### Quick Fix: Use Error Link

When you get an index error, Firebase usually provides a link in the error message. Click it to automatically create the required index.

## Testing

After indexes are created:

1. Clear app cache: `npx expo start --clear`
2. Reload the app
3. Try loading recordings again
4. The error should be gone!

## Notes

- Indexes are **free** but count towards your Firestore quota
- You can have up to **200 composite indexes** per project
- Single-field indexes are created automatically
- Composite indexes are only needed when combining `where` + `orderBy` on different fields
