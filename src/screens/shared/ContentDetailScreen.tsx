/**
 * Content Detail Screen (Router)
 * 
 * This screen acts as a thin router that determines the content type
 * and navigates to the appropriate viewer screen:
 * - Live streams → LiveStreamScreen
 * - Recordings → ReplayScreen
 * 
 * Used from Home feed where content could be of various types.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';

import { contentService } from '../../services/content.service';

// =============================================================================
// TYPES
// =============================================================================

type ContentDetailRouteParams = {
  ContentDetail: {
    id: string;
  };
};

type ContentType = 'stream' | 'recording' | 'post' | 'unknown';

interface ContentInfo {
  type: ContentType;
  targetId: string; // streamId or recordingId
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ContentDetailScreen(): JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ContentDetailRouteParams, 'ContentDetail'>>();
  const contentId = route.params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) {
      setError('No content ID provided');
      setIsLoading(false);
      return;
    }

    resolveContentType();
  }, [contentId]);

  /**
   * Resolve content type and navigate to appropriate screen.
   * 
   * This checks what type of content the ID refers to and redirects:
   * - If it's a stream → LiveStreamScreen
   * - If it's a recording → ReplayScreen
   * - Otherwise → show not found
   */
  async function resolveContentType(): Promise<void> {
    try {
      setIsLoading(true);
      setError(null);

      // Try to determine content type
      // The contentService should have a method to get content metadata
      const content = await contentService.getContentById(contentId);

      if (!content) {
        setError('Content not found');
        setIsLoading(false);
        return;
      }

      // Navigate based on content type
      // Use replace to prevent back button returning to this loading screen
      if (content.type === 'stream' || content.isLiveStream) {
        navigation.dispatch(
          CommonActions.replace('LiveStream', { streamId: content.streamId || contentId })
        );
        return;
      }

      if (content.type === 'recording' || content.isRecording) {
        navigation.dispatch(
          CommonActions.replace('Replay', { recordingId: content.recordingId || contentId })
        );
        return;
      }

      // For other content types (posts, etc.), show inline
      // For now, show not supported message
      setError('This content type is not yet supported');
      setIsLoading(false);

    } catch (err) {
      console.error('[ContentDetailScreen] Error resolving content:', err);
      setError('Failed to load content');
      setIsLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER: LOADING
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#ff0000" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: ERROR
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <View style={styles.centerWrap}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Content Unavailable</Text>
        <Text style={styles.errorMsg}>
          {error || 'This content could not be loaded.'}
        </Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMsg: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: 20,
  },
  backLink: {
    paddingVertical: 12,
  },
  backLinkText: {
    color: '#3ea6ff',
    fontSize: 14,
  },
});

