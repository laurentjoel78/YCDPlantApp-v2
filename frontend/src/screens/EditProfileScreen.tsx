import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Avatar, ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { useApp } from '../store/AppContext';

interface EditProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  region?: string;
  profileImage?: string;
}

const EditProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user, setUser } = useApp();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [region, setRegion] = useState(user?.region || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      if (firstName) formData.append('first_name', firstName);
      if (lastName) formData.append('last_name', lastName);
      if (phoneNumber) formData.append('phone_number', phoneNumber);
      if (region) formData.append('region', region);

      if (profileImage && !profileImage.startsWith('http')) {
        const filename = profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('profileImage', {
          uri: profileImage,
          name: filename || 'profile.jpg',
          type,
        } as any);
      }

      const response = await api.auth.updateProfile(formData as any);
      setUser(response.user);
      navigation.goBack();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarContainer: {
      marginBottom: 16,
    },
    changePhotoButton: {
      marginTop: 8,
    },
    inputContainer: {
      gap: 16,
      marginBottom: 24,
    },
    input: {
      backgroundColor: colors.surface,
    },
    saveButton: {
      marginTop: 8,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Not logged in</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const avatarName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || user.email?.split('@')[0] || 'User';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={120}
              source={
                profileImage
                  ? { uri: profileImage }
                  : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=2D5016&color=fff` }
              }
            />
            <Button
              mode="text"
              onPress={pickImage}
              style={styles.changePhotoButton}
              disabled={loading}
            >
              Change Photo
            </Button>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />
          <TextInput
            label="Phone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            disabled={loading}
          />
          <TextInput
            label="Region"
            value={region}
            onChangeText={setRegion}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;