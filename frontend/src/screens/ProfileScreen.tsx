import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService as AuthService } from '../services/authService';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { logout: authLogout, user: authUser, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // Build display user from auth context - no separate API call needed!
  // Backend returns snake_case, so we check both variants
  const user = {
    name: authUser?.name || `${(authUser as any)?.first_name || (authUser as any)?.firstName || ''} ${(authUser as any)?.last_name || (authUser as any)?.lastName || ''}`.trim() || 'User',
    email: authUser?.email || '',
    phone: (authUser as any)?.phone_number || (authUser as any)?.phoneNumber || '',
    location: (authUser as any)?.region || '',
    avatar: (authUser as any)?.profile_image_url || (authUser as any)?.profileImage || null,
    farms: authUser?.farms || [],
  };

  // Show loading only during auth initialization, not on every visit
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AuthService.logout();
              await authLogout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', t('profile.logoutError'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(t('common.comingSoon'), t('profile.edit') + ' - ' + t('common.loading'));
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(t('common.comingSoon'), `${feature} will be available in the next update.`);
  };

  const renderProfileItem = (icon: string, title: string, value: string) => (
    <View style={styles.infoItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon as any} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <MaterialCommunityIcons name="account" size={60} color="#FFF" />
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
            <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
          <TouchableOpacity onPress={handleEditProfile}>
            <Text style={styles.editButton}>{t('common.edit')}</Text>
          </TouchableOpacity>
        </View>

        {renderProfileItem('phone', t('profile.phone'), user.phone)}
        {renderProfileItem('map-marker', t('profile.location'), user.location)}
      </View>

      {/* Farms Section */}
      {user.farms && user.farms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.myFarms')} ({user.farms.length})</Text>
          {user.farms.map((farm: any, index: number) => (
            <View key={farm.id || index} style={styles.farmItem}>
              <MaterialCommunityIcons name="barn" size={28} color={theme.colors.primary} />
              <View style={styles.farmDetails}>
                <Text style={styles.farmName}>{farm.name}</Text>
                <Text style={styles.farmLocation}>
                  📍 Lat: {parseFloat(farm.location_lat).toFixed(4)}, Lng: {parseFloat(farm.location_lng).toFixed(4)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleComingSoon(t('profile.notifications'))}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
          <Text style={styles.menuText}>{t('profile.notifications')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.placeholder} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleComingSoon(t('profile.privacy'))}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={theme.colors.text} />
          <Text style={styles.menuText}>{t('profile.privacy')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.placeholder} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleComingSoon(t('profile.help'))}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={theme.colors.text} />
          <Text style={styles.menuText}>{t('profile.help')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.placeholder} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={24} color="#FFF" />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    backgroundColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  editButton: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
  },
  farmItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  farmDetails: {
    flex: 1,
    marginLeft: 12,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  farmLocation: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.error,
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    color: theme.colors.placeholder,
    marginBottom: 32,
    fontSize: 12,
  },
});

export default ProfileScreen;