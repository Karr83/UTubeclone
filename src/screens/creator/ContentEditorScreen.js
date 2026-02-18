// ContentEditorScreen - Create/edit content
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Button } from '../../components/common';
import { Input, Select } from '../../components/forms';
import * as ImagePicker from 'expo-image-picker';

const ContentEditorScreen = ({ navigation, route }) => {
  const isEditing = !!route?.params?.id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaLabel, setMediaLabel] = useState('No file selected');

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your content.');
      return;
    }
    Alert.alert(
      'Save Content',
      isEditing ? 'Content updated successfully!' : 'Content created successfully!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleUploadMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setMediaLabel(asset.fileName || asset.uri.split('/').pop() || 'Selected media');
      }
    } catch (error) {
      Alert.alert('Upload Media', 'Could not open media picker.');
    }
  };

  return (
    <ScreenContainer>
      <Header
        title={isEditing ? 'Edit Content' : 'New Content'}
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
        rightAction="Save"
        onRightPress={handleSave}
      />
      
      <View style={styles.form}>
        <Input
          label="Title"
          placeholder="Enter content title"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Description"
          placeholder="Describe your content"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
        <Select
          label="Access Level"
          placeholder="Select who can view"
          options={[
            { label: 'Free', value: 'free' },
            { label: 'Subscribers Only', value: 'subscribers' },
            { label: 'Premium', value: 'premium' },
          ]}
        />
        
        <View style={styles.mediaSection}>
          <Text variant="h3">Media</Text>
          <Text variant="caption" style={styles.mediaLabel}>{mediaLabel}</Text>
          <Button
            title="Upload Media"
            variant="secondary"
            onPress={handleUploadMedia}
            style={styles.uploadButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  form: {
    marginTop: 16,
  },
  mediaSection: {
    marginTop: 24,
  },
  uploadButton: {
    marginTop: 12,
  },
  mediaLabel: {
    marginTop: 8,
    opacity: 0.7,
  },
});

export default ContentEditorScreen;

