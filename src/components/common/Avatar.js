// Avatar Component - User/Creator profile image
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Text from './Text';

const Avatar = ({ 
  source, 
  name,
  size = 'medium',
  style,
}) => {
  const sizeStyles = sizes[size];
  
  // Show initials if no image
  if (!source) {
    const initials = name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : '?';
    
    return (
      <View style={[styles.placeholder, sizeStyles, style]}>
        <Text style={[styles.initials, { fontSize: sizeStyles.width / 2.5 }]}>
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <Image 
      source={source} 
      style={[styles.image, sizeStyles, style]} 
    />
  );
};

const sizes = {
  small: { width: 32, height: 32, borderRadius: 16 },
  medium: { width: 48, height: 48, borderRadius: 24 },
  large: { width: 72, height: 72, borderRadius: 36 },
  xlarge: { width: 120, height: 120, borderRadius: 60 },
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E5E7EB',
  },
  placeholder: {
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default Avatar;

