/**
 * Stream Dashboard Screen (Creator)
 * 
 * This screen is the main hub for creators to manage their live streams.
 * It shows current stream status, OBS setup info, and stream controls.
 * 
 * FEATURES:
 * - Create new stream
 * - View OBS setup instructions
 * - Stream status indicator
 * - End stream
 * - View past streams
 * 
 * IDENTITY PROTECTION:
 * - Supports audio-only mode
 * - Supports avatar mode (audio + static image)
 * - No forced camera requirement
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Clipboard,
  StyleSheet,
} from 'react-native';

import { useStream } from '../../hooks/useStream';
import {
  StreamVisibility,
  StreamMode,
  CreateStreamConfig,
} from '../../types/streaming';

// =============================================================================
// COMPONENT
// =============================================================================

export default function StreamDashboardScreen(): JSX.Element {
  const {
    currentStream,
    isLoading,
    error,
    canStream,
    isLive,
    obsSetup,
    createStream,
    goLive,
    endStream,
    regenerateKey,
    refresh,
  } = useStream();
  
  // Form state for creating stream
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<StreamVisibility>('public');
  const [mode, setMode] = useState<StreamMode>('video');
  const [isCreating, setIsCreating] = useState(false);
  
  // ---------------------------------------------------------------------------
  // CREATE STREAM
  // ---------------------------------------------------------------------------
  
  const handleCreateStream = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a stream title.');
      return;
    }
    
    setIsCreating(true);
    
    const config: CreateStreamConfig = {
      title: title.trim(),
      description: description.trim() || undefined,
      visibility,
      mode,
    };
    
    const stream = await createStream(config);
    
    if (stream) {
      setShowCreateForm(false);
      setTitle('');
      setDescription('');
    }
    
    setIsCreating(false);
  };
  
  // ---------------------------------------------------------------------------
  // COPY TO CLIPBOARD
  // ---------------------------------------------------------------------------
  
  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };
  
  // ---------------------------------------------------------------------------
  // END STREAM CONFIRMATION
  // ---------------------------------------------------------------------------
  
  const handleEndStream = () => {
    Alert.alert(
      'End Stream?',
      'Are you sure you want to end this stream? Viewers will be disconnected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: endStream,
        },
      ]
    );
  };
  
  // ---------------------------------------------------------------------------
  // RENDER: NOT A CREATOR
  // ---------------------------------------------------------------------------
  
  if (!canStream) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Cannot Stream</Text>
          <Text style={styles.errorText}>
            You need to be a creator with at least Basic tier to go live.
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: LOADING
  // ---------------------------------------------------------------------------
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading stream data...</Text>
        </View>
      </View>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: CREATE FORM
  // ---------------------------------------------------------------------------
  
  if (showCreateForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formContainer}>
        <Text style={styles.formTitle}>Create New Stream</Text>
        
        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter stream title"
          maxLength={100}
        />
        
        {/* Description */}
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's this stream about?"
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        
        {/* Visibility */}
        <Text style={styles.label}>Visibility</Text>
        <View style={styles.optionGroup}>
          {(['public', 'members'] as StreamVisibility[]).map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.optionButton,
                visibility === v && styles.optionButtonActive,
              ]}
              onPress={() => setVisibility(v)}
            >
              <Text
                style={[
                  styles.optionText,
                  visibility === v && styles.optionTextActive,
                ]}
              >
                {v === 'public' ? '🌍 Public' : '🔒 Members Only'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Mode - Identity Protection */}
        <Text style={styles.label}>Stream Mode</Text>
        <Text style={styles.labelHint}>
          Choose how you want to appear on stream
        </Text>
        <View style={styles.optionGroup}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'video' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('video')}
          >
            <Text style={styles.modeEmoji}>📹</Text>
            <Text style={styles.modeTitle}>Video</Text>
            <Text style={styles.modeDesc}>Full video + audio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'audio_only' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('audio_only')}
          >
            <Text style={styles.modeEmoji}>🎙️</Text>
            <Text style={styles.modeTitle}>Audio Only</Text>
            <Text style={styles.modeDesc}>No camera needed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'avatar' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('avatar')}
          >
            <Text style={styles.modeEmoji}>🎭</Text>
            <Text style={styles.modeTitle}>Avatar</Text>
            <Text style={styles.modeDesc}>Audio + static image</Text>
          </TouchableOpacity>
        </View>
        
        {/* Buttons */}
        <View style={styles.formButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCreateForm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              isCreating && styles.buttonDisabled,
            ]}
            onPress={handleCreateStream}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Stream</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: MAIN DASHBOARD
  // ---------------------------------------------------------------------------
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
    >
      {/* Header */}
      <Text style={styles.title}>Live Streaming</Text>
      
      {/* No Active Stream */}
      {!currentStream && (
        <View style={styles.noStreamCard}>
          <Text style={styles.noStreamTitle}>Ready to Go Live?</Text>
          <Text style={styles.noStreamText}>
            Create a new stream to get your RTMP credentials and start broadcasting.
          </Text>
          <TouchableOpacity
            style={styles.goLiveButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Text style={styles.goLiveButtonText}>🎬 Create Stream</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Active Stream */}
      {currentStream && (
        <>
          {/* Status Card */}
          <View style={[
            styles.statusCard,
            isLive ? styles.statusCardLive : styles.statusCardOffline,
          ]}>
            <View style={styles.statusHeader}>
              <View style={[
                styles.statusDot,
                isLive ? styles.statusDotLive : styles.statusDotOffline,
              ]} />
              <Text style={styles.statusText}>
                {isLive ? 'LIVE' : currentStream.status.toUpperCase()}
              </Text>
            </View>
            
            <Text style={styles.streamTitle}>{currentStream.title}</Text>
            
            {isLive && (
              <View style={styles.viewerInfo}>
                <Text style={styles.viewerCount}>
                  👁️ {currentStream.viewerCount} viewers
                </Text>
              </View>
            )}
            
            {currentStream.status === 'configuring' && (
              <Text style={styles.configHint}>
                Waiting for stream... Connect OBS to start broadcasting.
              </Text>
            )}
          </View>
          
          {/* OBS Setup Info */}
          {obsSetup && (
            <View style={styles.obsCard}>
              <Text style={styles.obsTitle}>📡 OBS Setup</Text>
              
              <Text style={styles.obsLabel}>Server URL</Text>
              <TouchableOpacity
                style={styles.obsValueBox}
                onPress={() => copyToClipboard(obsSetup.server, 'Server URL')}
              >
                <Text style={styles.obsValue}>{obsSetup.server}</Text>
                <Text style={styles.copyHint}>Tap to copy</Text>
              </TouchableOpacity>
              
              <Text style={styles.obsLabel}>Stream Key (Keep Secret!)</Text>
              <TouchableOpacity
                style={styles.obsValueBox}
                onPress={() => copyToClipboard(obsSetup.streamKey, 'Stream Key')}
              >
                <Text style={styles.obsValue}>
                  {obsSetup.streamKey.substring(0, 10)}...
                </Text>
                <Text style={styles.copyHint}>Tap to copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={regenerateKey}
              >
                <Text style={styles.regenerateText}>
                  🔄 Regenerate Key (if compromised)
                </Text>
              </TouchableOpacity>
              
              {/* Recommended Settings */}
              <View style={styles.settingsBox}>
                <Text style={styles.settingsTitle}>Recommended Settings</Text>
                <Text style={styles.settingsItem}>
                  • Video: {obsSetup.recommendedSettings.resolution}
                </Text>
                <Text style={styles.settingsItem}>
                  • Bitrate: {obsSetup.recommendedSettings.videoBitrate}
                </Text>
                <Text style={styles.settingsItem}>
                  • FPS: {obsSetup.recommendedSettings.fps}
                </Text>
                <Text style={styles.settingsItem}>
                  • Audio: {obsSetup.recommendedSettings.audioBitrate}
                </Text>
              </View>
            </View>
          )}
          
          {/* Stream Controls */}
          <View style={styles.controlsCard}>
            <Text style={styles.controlsTitle}>Controls</Text>
            
            {!isLive && currentStream.status === 'configuring' && (
              <TouchableOpacity
                style={styles.manualGoLiveButton}
                onPress={goLive}
              >
                <Text style={styles.manualGoLiveText}>
                  Manual Go Live (if auto-detect fails)
                </Text>
              </TouchableOpacity>
            )}
            
            {(isLive || currentStream.status === 'configuring') && (
              <TouchableOpacity
                style={styles.endStreamButton}
                onPress={handleEndStream}
              >
                <Text style={styles.endStreamText}>🛑 End Stream</Text>
              </TouchableOpacity>
            )}
            
            {currentStream.status === 'ended' && (
              <TouchableOpacity
                style={styles.goLiveButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Text style={styles.goLiveButtonText}>
                  🎬 Create New Stream
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
      
      {/* Error Display */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================================
// STYLES (Minimal per requirements)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Title
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  
  // Loading
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  
  // Error states
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // No stream card
  noStreamCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  noStreamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  noStreamText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  goLiveButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  goLiveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Status card
  statusCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusCardLive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderWidth: 2,
  },
  statusCardOffline: {
    backgroundColor: '#FFF',
    borderColor: '#E5E5E5',
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusDotLive: {
    backgroundColor: '#22C55E',
  },
  statusDotOffline: {
    backgroundColor: '#9CA3AF',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  viewerInfo: {
    marginTop: 8,
  },
  viewerCount: {
    fontSize: 16,
    color: '#374151',
  },
  configHint: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 8,
  },
  
  // OBS card
  obsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  obsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  obsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  obsValueBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  obsValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#000',
    flex: 1,
  },
  copyHint: {
    fontSize: 10,
    color: '#007AFF',
  },
  regenerateButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  regenerateText: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
  },
  settingsBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  settingsItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  
  // Controls
  controlsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  endStreamButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  endStreamText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  manualGoLiveButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  manualGoLiveText: {
    color: '#666',
    fontSize: 14,
  },
  
  // Form
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#000',
  },
  optionTextActive: {
    color: '#FFF',
  },
  modeButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  modeButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#007AFF',
  },
  modeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  modeDesc: {
    fontSize: 10,
    color: '#666',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

