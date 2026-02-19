import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { request, api } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../store/AppContext';
import { useAuth } from '../hooks';
import { setStoredToken } from '../utils/authStorage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGoogleAuth, useFacebookAuth, getGoogleUserInfo, getFacebookUserInfo } from '../services/socialAuthService';
import * as AuthSession from 'expo-auth-session';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  // Hide the navigation header
  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const { login, socialLogin } = useAuth();
  const { t } = useTranslation();

  // Social auth hooks
  const googleAuth = useGoogleAuth();
  const facebookAuth = useFacebookAuth();

  // Handle Google auth response
  useEffect(() => {
    if (googleAuth.response?.type === 'success') {
      handleGoogleSuccess(googleAuth.response.authentication?.accessToken);
    } else if (googleAuth.response?.type === 'error') {
      setError(t('auth.errors.googleFailed') || 'Google sign-in failed');
      setSocialLoading(null);
    }
  }, [googleAuth.response]);

  // Handle Facebook auth response
  useEffect(() => {
    if (facebookAuth.response?.type === 'success') {
      handleFacebookSuccess(facebookAuth.response.authentication?.accessToken);
    } else if (facebookAuth.response?.type === 'error') {
      setError(t('auth.errors.facebookFailed') || 'Facebook sign-in failed');
      setSocialLoading(null);
    }
  }, [facebookAuth.response]);

  const handleGoogleSuccess = async (accessToken?: string) => {
    if (!accessToken) {
      setError('No access token received from Google');
      setSocialLoading(null);
      return;
    }

    try {
      const result = await getGoogleUserInfo(accessToken);
      if (result.success && result.user) {
        await socialLogin('google', accessToken, {
          email: result.user.email,
          name: result.user.name,
          picture: result.user.picture,
          providerId: result.user.id,
        });
      } else {
        throw new Error(result.error || 'Failed to get user info');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || t('auth.errors.googleFailed'));
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookSuccess = async (accessToken?: string) => {
    if (!accessToken) {
      setError('No access token received from Facebook');
      setSocialLoading(null);
      return;
    }

    try {
      const result = await getFacebookUserInfo(accessToken);
      if (result.success && result.user) {
        await socialLogin('facebook', accessToken, {
          email: result.user.email,
          name: result.user.name,
          picture: result.user.picture,
          providerId: result.user.id,
        });
      } else {
        throw new Error(result.error || 'Failed to get user info');
      }
    } catch (err: any) {
      console.error('Facebook login error:', err);
      setError(err.message || t('auth.errors.facebookFailed'));
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setSocialLoading(provider);

    try {
      if (provider === 'google') {
        if (!googleAuth.isReady) {
          Alert.alert(
            t('auth.configRequired'),
            t('auth.googleNotConfigured') || 'Google sign-in is not configured. Please contact support.'
          );
          setSocialLoading(null);
          return;
        }
        await googleAuth.promptAsync();
      } else {
        if (!facebookAuth.isReady) {
          Alert.alert(
            t('auth.configRequired'),
            t('auth.facebookNotConfigured') || 'Facebook sign-in is not configured. Please contact support.'
          );
          setSocialLoading(null);
          return;
        }
        await facebookAuth.promptAsync();
      }
    } catch (err: any) {
      console.error(`${provider} login error:`, err);
      setError(err.message || `${provider} sign-in failed`);
      setSocialLoading(null);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.validation.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Navigation is handled by the auth context/navigation container based on token presence
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || t('auth.errors.loginFailed') || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>{t('auth.welcomeBack')}</Title>
        <Paragraph style={styles.headerText}>{t('auth.signInToContinue')}</Paragraph>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.socialButtonsContainer}>
            <Button
              mode="outlined"
              style={[styles.socialButton, { marginBottom: 10 }]}
              icon={() => socialLoading === 'google' ? <ActivityIndicator size={20} /> : <MaterialCommunityIcons name="google" size={20} color={theme.colors.primary} />}
              onPress={() => handleSocialLogin('google')}
              disabled={!!socialLoading || loading}
              loading={socialLoading === 'google'}
            >
              {t('auth.social.google')}
            </Button>

            <Button
              mode="outlined"
              style={styles.socialButton}
              icon={() => socialLoading === 'facebook' ? <ActivityIndicator size={20} /> : <MaterialCommunityIcons name="facebook" size={20} color={theme.colors.primary} />}
              onPress={() => handleSocialLogin('facebook')}
              disabled={!!socialLoading || loading}
              loading={socialLoading === 'facebook'}
            >
              {t('auth.social.facebook')}
            </Button>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.form}>
            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <TextInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />

            <Button
              mode="contained"
              style={styles.loginButton}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            >
              {t('auth.signIn')}
            </Button>
          </View>

          <Button
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordButton}
          >
            {t('auth.forgotPassword')}
          </Button>

          <View style={styles.registerContainer}>
            <Text>{t('auth.noAccount')}</Text>
            <Button
              onPress={() => navigation.navigate('Signup')}
              mode="text"
              compact
            >
              {t('auth.signUp')}
            </Button>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    paddingTop: 120,
    paddingBottom: 70,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  headerText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
    backgroundColor: '#fff'
  },
  socialButtonsContainer: {
    marginBottom: 24
  },
  socialButton: {
    marginVertical: 5
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)'
  },
  dividerText: {
    marginHorizontal: 10,
    color: 'rgba(0,0,0,0.5)'
  },
  form: {
    marginBottom: 10
  },
  input: {
    marginBottom: 15
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 6
  },
  forgotPasswordButton: {
    marginVertical: 10
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10
  }
});