/**
 * Firebase Seed Script (Admin SDK)
 * 
 * Run this script to add test data to Firestore
 * Usage: node seed-firebase-data.js
 * 
 * Requires: serviceAccountKey.json in project root
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
require('dotenv').config();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'social-vibing-karr',
});

const db = admin.firestore();

// Test data
const testContent = [
  {
    creatorId: 'test-creator-1',
    title: 'Amazing React Native Tutorial - Building Beautiful UIs',
    description: 'Learn how to build stunning mobile apps with React Native and Expo',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Video+1',
    visibility: 'public',
    status: 'published',
    viewCount: 125000,
    likeCount: 8500,
    commentCount: 120,
    isBoosted: false,
    boostLevel: 0,
    boostedAt: null,
    boostedBy: null,
    boostExpiresAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    creatorId: 'test-creator-2',
    title: 'TypeScript Masterclass - Advanced Patterns',
    description: 'Master advanced TypeScript techniques and design patterns',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/0066FF/FFFFFF?text=Video+2',
    visibility: 'public',
    status: 'published',
    viewCount: 89000,
    likeCount: 6200,
    commentCount: 95,
    isBoosted: true,
    boostLevel: 2,
    boostedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    boostedBy: 'creator',
    boostExpiresAt: null,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    creatorId: 'test-creator-1',
    title: 'Firebase Deep Dive - Authentication & Security',
    description: 'Complete guide to Firebase Authentication and security best practices',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/00AA00/FFFFFF?text=Video+3',
    visibility: 'public',
    status: 'published',
    viewCount: 67000,
    likeCount: 4500,
    commentCount: 78,
    isBoosted: false,
    boostLevel: 0,
    boostedAt: null,
    boostedBy: null,
    boostExpiresAt: null,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const testStreams = [
  {
    creatorId: 'test-creator-1',
    title: 'Live Coding: Building a React Native App',
    description: 'Join me as I build a complete React Native app from scratch',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Live+1',
    status: 'live',
    visibility: 'public',
    mode: 'video',
    streamKey: 'test-key-123',
    rtmpUrl: 'rtmp://rtmp.livepeer.com/live',
    playbackUrl: 'https://example.com/stream1.m3u8',
    viewerCount: 1250,
    peakViewerCount: 2500,
    totalViewers: 1000,
    isSuspended: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    startedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    creatorId: 'test-creator-2',
    title: 'TypeScript Tips & Tricks - Live Q&A',
    description: 'Ask me anything about TypeScript!',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/0066FF/FFFFFF?text=Live+2',
    status: 'live',
    visibility: 'public',
    mode: 'video',
    streamKey: 'test-key-456',
    rtmpUrl: 'rtmp://rtmp.livepeer.com/live',
    playbackUrl: 'https://example.com/stream2.m3u8',
    viewerCount: 890,
    peakViewerCount: 1200,
    totalViewers: 500,
    isSuspended: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    startedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const testRecordings = [
  {
    streamId: 'stream-1',
    creatorId: 'test-creator-1',
    creatorName: 'Tech Guru',
    title: 'React Native Tutorial - Complete Guide',
    description: 'Learn React Native from scratch with this comprehensive tutorial',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Recording+1',
    status: 'ready',
    visibility: 'public',
    playbackUrl: 'https://example.com/recording1.m3u8',
    durationSeconds: 1845,
    viewCount: 45000,
    uniqueViewers: 32000,
    peakLiveViewers: 5000,
    isDeleted: false,
    isHidden: false,
    streamStartedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
    streamEndedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1845000)),
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    streamId: 'stream-2',
    creatorId: 'test-creator-2',
    creatorName: 'Code Master',
    title: 'TypeScript Advanced Patterns',
    description: 'Master advanced TypeScript techniques and design patterns',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/0066FF/FFFFFF?text=Recording+2',
    status: 'ready',
    visibility: 'public',
    playbackUrl: 'https://example.com/recording2.m3u8',
    durationSeconds: 2100,
    viewCount: 67000,
    uniqueViewers: 48000,
    peakLiveViewers: 7200,
    isDeleted: false,
    isHidden: false,
    streamStartedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    streamEndedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2100000)),
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    streamId: 'stream-3',
    creatorId: 'test-creator-1',
    creatorName: 'Tech Guru',
    title: 'Firebase Deep Dive - Authentication',
    description: 'Complete guide to Firebase Authentication and security',
    thumbnailUrl: 'https://via.placeholder.com/1280x720/00AA00/FFFFFF?text=Recording+3',
    status: 'ready',
    visibility: 'public',
    playbackUrl: 'https://example.com/recording3.m3u8',
    durationSeconds: 1560,
    viewCount: 32000,
    uniqueViewers: 25000,
    peakLiveViewers: 3800,
    isDeleted: false,
    isHidden: false,
    streamStartedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    streamEndedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 1560000)),
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

// Seed function
async function seedData() {
  try {
    console.log('🌱 Starting to seed Firestore with Admin SDK...\n');
    const seededStreamRefs = [];
    const seededRecordingRefs = [];

    // Add content
    console.log('📹 Adding content...');
    for (const content of testContent) {
      await db.collection('content').add(content);
      console.log(`  ✅ Added: ${content.title}`);
    }

    // Add streams
    console.log('\n📺 Adding live streams...');
    for (const stream of testStreams) {
      const ref = await db.collection('streams').add(stream);
      seededStreamRefs.push(ref);
      console.log(`  ✅ Added: ${stream.title}`);
    }

    // Add recordings
    console.log('\n📼 Adding recordings...');
    for (const recording of testRecordings) {
      const ref = await db.collection('recordings').add(recording);
      seededRecordingRefs.push(ref);
      console.log(`  ✅ Added: ${recording.title}`);
    }

    // Add sample interaction data
    if (seededRecordingRefs.length > 0) {
      console.log('\n💬 Adding recording comments/reactions...');
      const recordingRef = seededRecordingRefs[0];
      await recordingRef.collection('comments').add({
        recordingId: recordingRef.id,
        userId: 'test-user-1',
        username: 'Demo User',
        userRole: 'viewer',
        text: 'This tutorial is really helpful. Thanks!',
        likeCount: 3,
        replyCount: 0,
        isDeleted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await recordingRef.collection('reactions').doc('test-user-1').set({
        userId: 'test-user-1',
        type: 'like',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('  ✅ Added comments and reactions for first recording');
    }

    if (seededStreamRefs.length > 0) {
      console.log('\n❤️ Adding stream reactions...');
      const streamRef = seededStreamRefs[0];
      await streamRef.collection('reactions').doc('test-user-2').set({
        userId: 'test-user-2',
        type: 'like',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('  ✅ Added reactions for first stream');
    }

    console.log('\n🔔 Adding subscriptions...');
    await db.collection('subscriptions').doc('test-user-1_test-creator-1').set({
      userId: 'test-user-1',
      creatorId: 'test-creator-1',
      tier: 'free',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('  ✅ Added sample subscription');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📱 Reload your app to see the data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run seed
seedData();
