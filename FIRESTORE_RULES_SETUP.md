# Firestore Security Rules Setup Guide

## Quick Setup

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com/
   - Select your project: `social-vibing-karr`

2. **Open Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Copy and Paste Rules**
   - Open the file `firestore.rules` in this project
   - Copy ALL the content
   - Paste it into the Firebase Console Rules editor
   - Click "Publish" button

4. **Verify Rules Are Active**
   - You should see a success message
   - The rules will be active immediately (no deployment needed)

## What These Rules Do

### Content Collection
- ✅ **Public content**: Anyone can read (no authentication required)
- ✅ **Members-only content**: Only authenticated users can read
- ✅ **Creators**: Can create, update, and delete their own content
- ✅ **Admins**: Full access to all content

### Queries Supported
These rules support all the queries your app makes:
- ✅ Public content feed (`where('visibility', '==', 'public')`)
- ✅ Boosted content (`where('isBoosted', '==', true)`)
- ✅ Members-only content (`where('visibility', '==', 'membersOnly')`)
- ✅ Creator content (`where('creatorId', '==', userId)`)

## Troubleshooting

### Still Getting Permission Errors?

1. **Check Authentication**
   - Make sure you're signed in (if querying members-only content)
   - Check the terminal for authentication errors

2. **Verify Rules Are Published**
   - Go to Firebase Console → Firestore → Rules
   - Check that your rules are visible and published
   - Look for any syntax errors (highlighted in red)

3. **Clear App Cache**
   - Stop the Expo server (Ctrl+C)
   - Run: `npx expo start --clear`
   - Reload the app

4. **Check Query Structure**
   - Make sure your queries match the rule conditions
   - Public content queries should work without authentication
   - Members-only queries require authentication

### Common Issues

**Issue**: "Missing or insufficient permissions" for public content
- **Solution**: Make sure the rules allow `read: if resource.data.visibility == 'public'`
- **Check**: Verify the content document has `visibility: 'public'` field

**Issue**: "Missing or insufficient permissions" for authenticated users
- **Solution**: Make sure you're signed in
- **Check**: Verify `request.auth.uid` exists in the rules

**Issue**: Rules not taking effect
- **Solution**: Wait 1-2 minutes after publishing, then reload the app
- **Check**: Clear Metro bundler cache: `npx expo start --clear`

## Testing Rules

You can test your rules in the Firebase Console:
1. Go to Firestore Database → Rules tab
2. Click "Rules Playground" button
3. Select a collection (e.g., `content`)
4. Choose an operation (e.g., `read`)
5. Set authentication state
6. Click "Run" to test

## Next Steps

After setting up rules:
1. ✅ Rules are published
2. ✅ Clear app cache: `npx expo start --clear`
3. ✅ Reload the app
4. ✅ Test public content feed (should work without login)
5. ✅ Test members-only content (should work after login)

## Need Help?

If you're still experiencing issues:
1. Check the Firebase Console → Firestore → Rules for syntax errors
2. Check the terminal for specific error messages
3. Verify your Firebase project ID matches your `.env` file
4. Make sure you're using the correct Firebase project
