// ContentEditorScreen - Create/edit content
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Button } from '../../components/common';
import { Input, Select } from '../../components/forms';

const ContentEditorScreen = ({ navigation, route }) => {
  const isEditing = !!route?.params?.id;

  return (
    <ScreenContainer>
      <Header
        title={isEditing ? 'Edit Content' : 'New Content'}
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
        rightAction="Save"
        onRightPress={() => {
          // TODO: Save content
          navigation.goBack();
        }}
      />
      
      <View style={styles.form}>
        <Input
          label="Title"
          placeholder="Enter content title"
        />
        <Input
          label="Description"
          placeholder="Describe your content"
          multiline
          numberOfLines={4}
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
            onPress={() => {
              // TODO: Implement media picker
            }}
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

