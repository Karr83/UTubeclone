// ContentEditorScreen - Create/edit content
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Button } from '../../components/common';
import { Input, Select } from '../../components/forms';

const ContentEditorScreen = ({ navigation, route }) => {
  const isEditing = !!route?.params?.id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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

  const handleUploadMedia = () => {
    Alert.alert(
      'Upload Media',
      'Media picker will be available soon. You can upload images and videos from your device.',
      [{ text: 'OK' }]
    );
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
});

export default ContentEditorScreen;

