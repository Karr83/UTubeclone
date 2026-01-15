/**
 * Creator Upload Screen
 * 
 * Allows creators to upload new content (images and videos).
 * This screen demonstrates:
 * - Role-based access control (creator only)
 * - Membership-based feature gating (video uploads)
 * - Media picker integration
 * - Upload progress tracking
 * - Form validation
 * 
 * ACCESS CONTROL:
 * - Only accessible to users with 'creator' role
 * - Video uploads require Basic+ membership tier
 * - Image uploads available to all creators
 * 
 * FUTURE ENHANCEMENTS:
 * - Thumbnail selection/generation
 * - Draft saving
 * - Scheduled publishing
 * - Multiple file uploads
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../contexts/AuthContext';
import { useMembership } from '../../contexts/MembershipContext';
import { useContentUpload } from '../../hooks/useContentUpload';
import { TierBadge, UpgradePrompt } from '../../components/gates';
import {
  MediaType,
  ContentVisibility,
  CreateContentData,
} from '../../types/content';

// =============================================================================
// COMPONENT
// =============================================================================

export default function UploadScreen(): JSX.Element {
  const { profile } = useAuth();
  const { tier, canAccess } = useMembership();
  const { canUpload, canUploadVideo, isSuspended, upload, isUploading, progress, error, reset } = useContentUpload();

  // ---------------------------------------------------------------------------
  // FORM STATE
  // ---------------------------------------------------------------------------
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<ContentVisibility>('public');
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: MediaType;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // ACCESS CONTROL - SUSPENDED USER
  // ---------------------------------------------------------------------------

  if (isSuspended) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedEmoji}>⏸️</Text>
        <Text style={styles.accessDeniedTitle}>Account Suspended</Text>
        <Text style={styles.accessDeniedText}>
          Your account has been suspended. You cannot upload new content.
        </Text>
        <Text style={styles.accessDeniedSubtext}>
          Contact support if you believe this is an error.
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // ACCESS CONTROL - NOT A CREATOR
  // ---------------------------------------------------------------------------

  if (!canUpload) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedEmoji}>🚫</Text>
        <Text style={styles.accessDeniedTitle}>Creator Access Only</Text>
        <Text style={styles.accessDeniedText}>
          You need a creator account to upload content.
        </Text>
        <Text style={styles.accessDeniedSubtext}>
          Current role: {profile?.role || 'user'}
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // MEDIA PICKER
  // ---------------------------------------------------------------------------

  /**
   * Open image picker to select a photo.
   */
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia({
          uri: result.assets[0].uri,
          type: 'image',
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  /**
   * Open video picker to select a video.
   * Only available for Basic+ tier creators.
   */
  const pickVideo = async () => {
    if (!canUploadVideo) {
      Alert.alert(
        'Upgrade Required',
        'Video uploads require Basic tier or higher.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia({
          uri: result.assets[0].uri,
          type: 'video',
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  // ---------------------------------------------------------------------------
  // FORM SUBMISSION
  // ---------------------------------------------------------------------------

  /**
   * Validate and submit the upload form.
   */
  const handleUpload = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your content.');
      return;
    }

    if (!selectedMedia) {
      Alert.alert('No Media', 'Please select an image or video to upload.');
      return;
    }

    try {
      const data: CreateContentData = {
        title: title.trim(),
        description: description.trim() || undefined,
        mediaType: selectedMedia.type,
        localMediaUri: selectedMedia.uri,
        visibility,
      };

      const result = await upload(data);

      Alert.alert(
        'Upload Complete!',
        `Your ${selectedMedia.type} has been published.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setVisibility('public');
              setSelectedMedia(null);
              reset();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Upload Content</Text>
        <View style={styles.tierRow}>
          <Text style={styles.tierLabel}>Your tier:</Text>
          <TierBadge tier={tier} size="medium" />
        </View>
      </View>

      {/* Media Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Media</Text>
        
        <View style={styles.mediaButtons}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={pickImage}
            disabled={isUploading}
          >
            <Text style={styles.mediaButtonEmoji}>📷</Text>
            <Text style={styles.mediaButtonText}>Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mediaButton,
              !canUploadVideo && styles.mediaButtonDisabled,
            ]}
            onPress={pickVideo}
            disabled={isUploading}
          >
            <Text style={styles.mediaButtonEmoji}>🎬</Text>
            <Text style={styles.mediaButtonText}>Video</Text>
            {!canUploadVideo && (
              <Text style={styles.mediaButtonBadge}>Basic+</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Video Upgrade Prompt */}
        {!canUploadVideo && (
          <View style={styles.upgradePrompt}>
            <Text style={styles.upgradeText}>
              🔒 Video uploads require Basic tier or higher
            </Text>
          </View>
        )}

        {/* Selected Media Preview */}
        {selectedMedia && (
          <View style={styles.preview}>
            {selectedMedia.type === 'image' ? (
              <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.videoPreview}>
                <Text style={styles.videoPreviewEmoji}>🎬</Text>
                <Text style={styles.videoPreviewText}>Video Selected</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setSelectedMedia(null)}
            >
              <Text style={styles.removeButtonText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Details</Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a title for your content"
          placeholderTextColor="#9CA3AF"
          editable={!isUploading}
          maxLength={100}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add a description (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          editable={!isUploading}
          maxLength={500}
        />
      </View>

      {/* Visibility Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visibility</Text>

        <TouchableOpacity
          style={[
            styles.visibilityOption,
            visibility === 'public' && styles.visibilityOptionSelected,
          ]}
          onPress={() => setVisibility('public')}
          disabled={isUploading}
        >
          <Text style={styles.visibilityEmoji}>🌍</Text>
          <View style={styles.visibilityTextContainer}>
            <Text style={styles.visibilityLabel}>Public</Text>
            <Text style={styles.visibilityDescription}>
              Anyone can view this content
            </Text>
          </View>
          {visibility === 'public' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.visibilityOption,
            visibility === 'membersOnly' && styles.visibilityOptionSelected,
          ]}
          onPress={() => setVisibility('membersOnly')}
          disabled={isUploading}
        >
          <Text style={styles.visibilityEmoji}>🔒</Text>
          <View style={styles.visibilityTextContainer}>
            <Text style={styles.visibilityLabel}>Members Only</Text>
            <Text style={styles.visibilityDescription}>
              Only your subscribers can view
            </Text>
          </View>
          {visibility === 'membersOnly' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      {/* Upload Progress */}
      {isUploading && (
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Uploading...</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress.progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{progress.progress}%</Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (isUploading || !selectedMedia) && styles.uploadButtonDisabled,
        ]}
        onPress={handleUpload}
        disabled={isUploading || !selectedMedia}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Content</Text>
        )}
      </TouchableOpacity>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  tierLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Section
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Media Buttons
  mediaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mediaButtonDisabled: {
    opacity: 0.6,
  },
  mediaButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  mediaButtonBadge: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Upgrade Prompt
  upgradePrompt: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },

  // Preview
  preview: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  videoPreview: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoPreviewText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },

  // Form
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Visibility Options
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  visibilityOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  visibilityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  visibilityTextContainer: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  visibilityDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#6366F1',
    fontWeight: 'bold',
  },

  // Progress
  progressSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },

  // Error
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },

  // Upload Button
  uploadButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Access Denied
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  accessDeniedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  bottomPadding: {
    height: 48,
  },
});

