import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Avatar, ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { useApp } from '../store/AppContext';
import { useAuth } from '../hooks/useAuth';
import MMKVStorage from '../utils/storage';
import { CacheManager, CACHE_KEYS } from '../services/cacheManager';

interface EditProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  region?: string;
  profileImage?: string;
}

const EditProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { user: appUser, setUser: setAppUser } = useApp();
  const { user: authUser, token, logout, setUser: setAuthUser } = useAuth();
  // Prefer auth context user as source of truth
  const contextUser = (authUser || appUser) as any;

  // State for the resolved user (may be loaded async from storage)
  const [resolvedUser, setResolvedUser] = useState<any>(contextUser);
  const [userLoading, setUserLoading] = useState(!contextUser);

  // If context user becomes available later (e.g. async load), update
  useEffect(() => {
    if (contextUser && !resolvedUser) {
      setResolvedUser(contextUser);
      setUserLoading(false);
    }
  }, [contextUser]);

  // Fallback: load user from persistent storage or API when context is empty
  useEffect(() => {
    if (resolvedUser) return; // already have user data
    (async () => {
      try {
        // Try MMKV storage first
        const storedUserJson = await MMKVStorage.getItem('user');
        if (storedUserJson) {
          const storedUser = JSON.parse(storedUserJson);
          console.log('[EditProfile] Loaded user from MMKV storage');
          setResolvedUser(storedUser);
          // Also update AuthContext so other screens stay in sync
          if (setAuthUser) setAuthUser(storedUser);
          setUserLoading(false);
          return;
        }

        // Try fetching from API using stored token
        const storedToken = await MMKVStorage.getItem('token');
        if (storedToken) {
          console.log('[EditProfile] Fetching profile from API...');
          const profile = await api.auth.profile(storedToken);
          if (profile?.user) {
            setResolvedUser(profile.user);
            if (setAuthUser) setAuthUser(profile.user);
            await MMKVStorage.setItem('user', JSON.stringify(profile.user));
            setUserLoading(false);
            return;
          }
        }

        // Nothing worked — user is truly not logged in
        setUserLoading(false);
      } catch (err) {
        console.warn('[EditProfile] Failed to load user from storage/API:', err);
        setUserLoading(false);
      }
    })();
  }, [resolvedUser]);

  const user = resolvedUser;
  // Handle both snake_case (from API) and camelCase (from type) with type casting
  const userData = user as any;
  const [firstName, setFirstName] = useState(userData?.first_name || user?.firstName || '');
  const [lastName, setLastName] = useState(userData?.last_name || user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phone_number || user?.phoneNumber || '');
  const [region, setRegion] = useState(user?.region || '');
  const [profileImage, setProfileImage] = useState<string | null>(userData?.profile_image_url || user?.profileImage || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form fields when user data loads asynchronously
  useEffect(() => {
    if (user) {
      const ud = user as any;
      setFirstName(ud?.first_name || user?.firstName || '');
      setLastName(ud?.last_name || user?.lastName || '');
      setPhoneNumber(ud?.phone_number || user?.phoneNumber || '');
      setRegion(user?.region || '');
      setProfileImage(ud?.profile_image_url || user?.profileImage || null);
    }
  }, [user]);

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

      console.log('[EditProfile] Using token:', token ? `${token.substring(0, 12)}...` : 'no-token');
      const response = await api.auth.updateProfile(formData as any);
      // Update both AuthContext and AppContext to keep UI in sync
      try {
        if (setAuthUser) setAuthUser(response.user);
      } catch { }
      try {
        if (setAppUser) setAppUser(response.user);
      } catch { }
      // Also update persistent caches
      try {
        await MMKVStorage.setItem('user', JSON.stringify(response.user));
        await CacheManager.set(CACHE_KEYS.USER, response.user, 24 * 60 * 60 * 1000);
      } catch (e) {
        console.warn('Failed to update persisted user cache', e);
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error updating profile:', err);
      const msg = (err as any)?.message || '';
      if (msg.includes('Authentication') || msg.includes('401') || msg.includes('Authentication required')) {
        // Token invalid or expired - force logout
        try {
          await logout();
        } catch { }
        (navigation as any).navigate('Login');
        return;
      }
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