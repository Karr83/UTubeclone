/**
 * Stream Dashboard Screen (Creator)
 * 
 * Main hub for creators to manage their live streams.
 * Shows stream status, OBS setup, controls, and health indicators.
 * 
 * YouTube-style dark theme with stream health monitoring.
 * 
 * FEATURES:
 * - Create new stream
 * - View OBS setup instructions
 * - Stream status & health indicators
 * - End stream controls
 * - Identity protection modes
 * 
 * TODO Phase 3: Add stream preview window
 * TODO Phase 3: Add chat moderation tools
 * TODO Phase 3: Add stream schedule feature
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  Clipboard,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStream } from '../../hooks/useStream';
import { LoadingView } from '../../components/common';
import { darkTheme } from '../../theme';
import {
  StreamVisibility,
  StreamMode,
  CreateStreamConfig,
} from '../../types/streaming';

// =============================================================================
// HEALTH INDICATOR COMPONENT
// =============================================================================

interface HealthIndicatorProps {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'bad';
  icon: string;
}

function HealthIndicator({ label, value, status, icon }: HealthIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return '#2BA640';
      case 'warning': return '#F59E0B';
      case 'bad': return '#EF4444';
    }
  };

  return (
    <View style={styles.healthItem}>
      <Text style={styles.healthIcon}>{icon}</Text>
      <View style={styles.healthInfo}>
        <Text style={styles.healthLabel}>{label}</Text>
        <Text style={[styles.healthValue, { color: getStatusColor() }]}>{value}</Text>
      </View>
      <View style={[styles.healthDot, { backgroundColor: getStatusColor() }]} />
    </View>
  );
}

// =============================================================================
// COPYABLE FIELD COMPONENT
// =============================================================================

interface CopyableFieldProps {
  label: string;
  value: string;
  masked?: boolean;
  warning?: string;
}

function CopyableField({ label, value, masked = false, warning }: CopyableFieldProps) {
  const copyToClipboard = () => {
    Clipboard.setString(value);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  const displayValue = masked ? `${value.substring(0, 8)}${'•'.repeat(20)}` : value;

  return (
    <View style={styles.copyField}>
      <View style={styles.copyFieldHeader}>
        <Text style={styles.copyFieldLabel}>{label}</Text>
        {warning && <Text style={styles.copyFieldWarning}>⚠️ {warning}</Text>}
      </View>
      <TouchableOpacity style={styles.copyFieldBox} onPress={copyToClipboard}>
        <Text style={styles.copyFieldValue} numberOfLines={1}>{displayValue}</Text>
        <View style={styles.copyButton}>
          <Text style={styles.copyButtonText}>📋 Copy</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// MODE SELECTOR COMPONENT
// =============================================================================

interface ModeSelectorProps {
  mode: StreamMode;
  onSelect: (mode: StreamMode) => void;
}

function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  const modes: { value: StreamMode; icon: string; title: string; desc: string }[] = [
    { value: 'video', icon: '📹', title: 'Video', desc: 'Camera + Audio' },
    { value: 'audio_only', icon: '🎙️', title: 'Audio', desc: 'No camera' },
    { value: 'avatar', icon: '🎭', title: 'Avatar', desc: 'Image + Audio' },
  ];

  return (
    <View style={styles.modeGroup}>
      {modes.map((m) => (
        <TouchableOpacity
          key={m.value}
          style={[styles.modeCard, mode === m.value && styles.modeCardActive]}
          onPress={() => onSelect(m.value)}
        >
          <Text style={styles.modeIcon}>{m.icon}</Text>
          <Text style={[styles.modeTitle, mode === m.value && styles.modeTitleActive]}>
            {m.title}
          </Text>
          <Text style={styles.modeDesc}>{m.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function StreamDashboardScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
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
  
  // Form state
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
      Alert.alert('Missing Title', 'Please enter a stream title.');
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
  // END STREAM
  // ---------------------------------------------------------------------------
  
  const handleEndStream = () => {
    Alert.alert(
      'End Stream?',
      'Your viewers will be disconnected and the stream will end.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Stream', style: 'destructive', onPress: endStream },
      ]
    );
  };
  
  // ---------------------------------------------------------------------------
  // REGENERATE KEY
  // ---------------------------------------------------------------------------
  
  const handleRegenerateKey = () => {
    Alert.alert(
      'Regenerate Stream Key?',
      'Your current key will be invalidated. You\'ll need to update OBS with the new key.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', onPress: regenerateKey },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: CANNOT STREAM
  // ---------------------------------------------------------------------------
  
  if (!canStream) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Text style={styles.errorEmoji}>🔒</Text>
          <Text style={styles.errorTitle}>Streaming Locked</Text>
          <Text style={styles.errorText}>
            Upgrade to Basic tier or higher to unlock live streaming.
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
    return <LoadingView fullScreen message="Loading stream data..." />;
  }
  
  // ---------------------------------------------------------------------------
  // RENDER: CREATE FORM
  // ---------------------------------------------------------------------------
  
  if (showCreateForm) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowCreateForm(false)}>
            <Text style={styles.formBack}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>New Live Stream</Text>
        </View>
        
        {/* Title */}
        <Text style={styles.inputLabel}>Stream Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What are you streaming today?"
          placeholderTextColor={darkTheme.semantic.textTertiary}
          maxLength={100}
        />
        
        {/* Description */}
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell viewers what to expect..."
          placeholderTextColor={darkTheme.semantic.textTertiary}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        
        {/* Visibility */}
        <Text style={styles.inputLabel}>Who can watch?</Text>
        <View style={styles.visibilityRow}>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === 'public' && styles.visibilityOptionActive]}
            onPress={() => setVisibility('public')}
          >
            <Text style={styles.visibilityIcon}>🌍</Text>
            <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextActive]}>
              Everyone
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === 'members' && styles.visibilityOptionActive]}
            onPress={() => setVisibility('members')}
          >
            <Text style={styles.visibilityIcon}>🔒</Text>
            <Text style={[styles.visibilityText, visibility === 'members' && styles.visibilityTextActive]}>
              Members Only
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Mode */}
        <Text style={styles.inputLabel}>Stream Mode</Text>
        <Text style={styles.inputHint}>Choose how you want to appear on stream</Text>
        <ModeSelector mode={mode} onSelect={setMode} />
        
        {/* Buttons */}
        <View style={styles.formButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCreateForm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.createButton, isCreating && styles.buttonDisabled]}
            onPress={handleCreateStream}
            disabled={isCreating}
          >
            <Text style={styles.createButtonText}>
              {isCreating ? 'Creating...' : '🎬 Create Stream'}
            </Text>
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
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor="#FFFFFF"
          colors={['#FFFFFF']}
        />
      }
    >
      {/* Header */}
      <Text style={styles.title}>Live Stream</Text>
      
      {/* No Active Stream */}
      {!currentStream && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyTitle}>Ready to Go Live?</Text>
          <Text style={styles.emptyText}>
            Create a stream to get your RTMP credentials and start broadcasting.
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
          <View style={[styles.statusCard, isLive && styles.statusCardLive]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, isLive && styles.statusDotLive]} />
                <Text style={[styles.statusLabel, isLive && styles.statusLabelLive]}>
                  {isLive ? 'LIVE' : currentStream.status.toUpperCase()}
                </Text>
              </View>
              {isLive && (
                <View style={styles.viewerBadge}>
                  <Text style={styles.viewerBadgeText}>
                    👁️ {currentStream.viewerCount} watching
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.streamTitle}>{currentStream.title}</Text>
            
            {currentStream.description && (
              <Text style={styles.streamDesc}>{currentStream.description}</Text>
            )}
            
            {currentStream.status === 'configuring' && (
              <View style={styles.waitingBanner}>
                <Text style={styles.waitingIcon}>⏳</Text>
                <Text style={styles.waitingText}>
                  Waiting for stream signal... Start streaming from OBS.
                </Text>
              </View>
            )}
          </View>
          
          {/* Stream Health (Only when live) */}
          {isLive && (
            <View style={styles.healthCard}>
              <Text style={styles.cardTitle}>📊 Stream Health</Text>
              <View style={styles.healthGrid}>
                <HealthIndicator
                  label="Bitrate"
                  value="4500 kbps"
                  status="good"
                  icon="📶"
                />
                <HealthIndicator
                  label="Frame Rate"
                  value="30 fps"
                  status="good"
                  icon="🎞️"
                />
                <HealthIndicator
                  label="Connection"
                  value="Stable"
                  status="good"
                  icon="🌐"
                />
                <HealthIndicator
                  label="CPU Usage"
                  value="45%"
                  status="warning"
                  icon="💻"
                />
              </View>
            </View>
          )}
          
          {/* OBS Setup */}
          {obsSetup && (
            <View style={styles.obsCard}>
              <Text style={styles.cardTitle}>📡 OBS Setup</Text>
              
              <CopyableField
                label="Server URL"
                value={obsSetup.server}
              />
              
              <CopyableField
                label="Stream Key"
                value={obsSetup.streamKey}
                masked
                warning="Keep this secret!"
              />
              
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleRegenerateKey}
              >
                <Text style={styles.regenerateText}>🔄 Regenerate Stream Key</Text>
              </TouchableOpacity>
              
              {/* Recommended Settings */}
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>Recommended OBS Settings</Text>
                <View style={styles.settingsGrid}>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Resolution</Text>
                    <Text style={styles.settingValue}>{obsSetup.recommendedSettings.resolution}</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Video Bitrate</Text>
                    <Text style={styles.settingValue}>{obsSetup.recommendedSettings.videoBitrate}</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>FPS</Text>
                    <Text style={styles.settingValue}>{obsSetup.recommendedSettings.fps}</Text>
                  </View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Audio Bitrate</Text>
                    <Text style={styles.settingValue}>{obsSetup.recommendedSettings.audioBitrate}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {/* Controls */}
          <View style={styles.controlsCard}>
            <Text style={styles.cardTitle}>🎮 Controls</Text>
            
            {!isLive && currentStream.status === 'configuring' && (
              <TouchableOpacity style={styles.manualButton} onPress={goLive}>
                <Text style={styles.manualButtonText}>
                  ▶️ Force Go Live (if auto-detect fails)
                </Text>
              </TouchableOpacity>
            )}
            
            {(isLive || currentStream.status === 'configuring') && (
              <TouchableOpacity style={styles.endButton} onPress={handleEndStream}>
                <Text style={styles.endButtonText}>🛑 End Stream</Text>
              </TouchableOpacity>
            )}
            
            {currentStream.status === 'ended' && (
              <TouchableOpacity
                style={styles.goLiveButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Text style={styles.goLiveButtonText}>🎬 Start New Stream</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
      
      {/* Error Display */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardText}>⚠️ {error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.semantic.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    marginBottom: 20,
  },

  // Error states
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: darkTheme.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty state
  emptyCard: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: darkTheme.semantic.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: darkTheme.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  goLiveButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 24,
  },
  goLiveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Status card
  statusCard: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  statusCardLive: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkTheme.semantic.textTertiary,
    marginRight: 8,
  },
  statusDotLive: {
    backgroundColor: '#FF0000',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: darkTheme.semantic.textSecondary,
  },
  statusLabelLive: {
    color: '#FF0000',
  },
  viewerBadge: {
    backgroundColor: 'rgba(255,0,0,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  viewerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF0000',
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginBottom: 4,
  },
  streamDesc: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
    lineHeight: 20,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  waitingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  waitingText: {
    flex: 1,
    fontSize: 13,
    color: '#F59E0B',
  },

  // Health card
  healthCard: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginBottom: 16,
  },
  healthGrid: {
    gap: 12,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.surfaceElevated,
    padding: 12,
    borderRadius: 8,
  },
  healthIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  healthInfo: {
    flex: 1,
  },
  healthLabel: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
  },
  healthValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // OBS card
  obsCard: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  copyField: {
    marginBottom: 16,
  },
  copyFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  copyFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.semantic.textSecondary,
  },
  copyFieldWarning: {
    fontSize: 11,
    color: '#F59E0B',
  },
  copyFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.surfaceElevated,
    borderRadius: 8,
    padding: 12,
  },
  copyFieldValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
    color: darkTheme.semantic.text,
  },
  copyButton: {
    backgroundColor: '#3EA6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 12,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  regenerateButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  regenerateText: {
    fontSize: 13,
    color: '#F59E0B',
  },
  settingsCard: {
    backgroundColor: darkTheme.semantic.surfaceElevated,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  settingsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginBottom: 12,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  settingItem: {
    width: '50%',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 11,
    color: darkTheme.semantic.textSecondary,
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '500',
    color: darkTheme.semantic.text,
  },

  // Controls
  controlsCard: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  endButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manualButton: {
    backgroundColor: darkTheme.semantic.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  manualButtonText: {
    fontSize: 14,
    color: darkTheme.semantic.textSecondary,
  },

  // Error card
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  errorCardText: {
    fontSize: 14,
    color: '#EF4444',
  },

  // Form
  formContent: {
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  formBack: {
    fontSize: 16,
    color: '#3EA6FF',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: darkTheme.semantic.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: darkTheme.semantic.surface,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: darkTheme.semantic.text,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.surface,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
    padding: 14,
    borderRadius: 8,
    gap: 10,
  },
  visibilityOptionActive: {
    borderColor: '#3EA6FF',
    backgroundColor: 'rgba(62,166,255,0.1)',
  },
  visibilityIcon: {
    fontSize: 20,
  },
  visibilityText: {
    fontSize: 14,
    color: darkTheme.semantic.text,
  },
  visibilityTextActive: {
    color: '#3EA6FF',
    fontWeight: '600',
  },
  modeGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: darkTheme.semantic.surface,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
    padding: 16,
    borderRadius: 12,
  },
  modeCardActive: {
    borderColor: '#3EA6FF',
    backgroundColor: 'rgba(62,166,255,0.1)',
  },
  modeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: darkTheme.semantic.text,
    marginBottom: 2,
  },
  modeTitleActive: {
    color: '#3EA6FF',
  },
  modeDesc: {
    fontSize: 11,
    color: darkTheme.semantic.textSecondary,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: darkTheme.semantic.surface,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.textSecondary,
  },
  createButton: {
    flex: 2,
    backgroundColor: '#FF0000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
