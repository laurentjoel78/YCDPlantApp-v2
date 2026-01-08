import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  
  // Mock mode state - for when server returns a token directly
  const [mockMode, setMockMode] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const response = await api.auth.requestPasswordReset(email);
      
      // Check if we're in mock mode (server returns token directly)
      if (response.mockMode && response.resetToken) {
        setMockMode(true);
        setResetToken(response.resetToken);
      } else if (response.mockMode && response.userNotFound) {
        setError('No account found with this email address');
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.auth.resetPassword(resetToken!, newPassword);
      setResetComplete(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Render reset complete screen
  if (resetComplete) {
    return (
      <LinearGradient
        colors={[theme.colors.primary, '#1B4332']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <View style={styles.container}>
          <View style={styles.successContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.primary} />
            <Title style={styles.successTitle}>Password Reset!</Title>
            <Text style={styles.successText}>
              Your password has been successfully reset. You can now login with your new password.
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={styles.backButton}
              buttonColor={theme.colors.primary}
            >
              Go to Login
            </Button>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Render new password form (mock mode)
  if (mockMode && resetToken) {
    return (
      <LinearGradient
        colors={[theme.colors.primary, '#1B4332']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="lock-reset" size={64} color={theme.colors.primary} />
              <Title style={styles.title}>Create New Password</Title>
              <Paragraph style={styles.subtitle}>
                Enter your new password below
              </Paragraph>
            </View>

            <View style={styles.formContainer}>
              {error && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
                </View>
              )}

              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                mode="flat"
                secureTextEntry
                left={<TextInput.Icon icon="lock" />}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    background: 'white'
                  }
                }}
              />

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                mode="flat"
                secureTextEntry
                left={<TextInput.Icon icon="lock-check" />}
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    background: 'white'
                  }
                }}
              />

              <Button
                mode="contained"
                onPress={handleResetPassword}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                buttonColor={theme.colors.primary}
              >
                {loading ? <ActivityIndicator animating={true} color="white" /> : 'Reset Password'}
              </Button>

              <Button
                mode="text"
                onPress={() => {
                  setMockMode(false);
                  setResetToken(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                textColor={theme.colors.primary}
                style={styles.backButton}
              >
                Back
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.primary, '#1B4332']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backgroundGradient}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="lock-reset" size={64} color={theme.colors.primary} />
            <Title style={styles.title}>Reset Password</Title>
            <Paragraph style={styles.subtitle}>
              Enter your email address and we'll help you reset your password
            </Paragraph>
          </View>

          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
              </View>
            )}

            {success ? (
              <View style={styles.successContainer}>
                <MaterialCommunityIcons name="check-circle" size={48} color={theme.colors.primary} />
                <Text style={styles.successText}>
                  Password reset instructions have been sent to your email address.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.backButton}
                  buttonColor={theme.colors.primary}
                >
                  Back to Login
                </Button>
              </View>
            ) : (
              <>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  mode="flat"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email" />}
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      background: 'white'
                    }
                  }}
                />

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={loading}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                  buttonColor={theme.colors.primary}
                >
                  {loading ? <ActivityIndicator animating={true} color="white" /> : 'Reset My Password'}
                </Button>

                <Button
                  mode="text"
                  onPress={() => navigation.goBack()}
                  textColor={theme.colors.primary}
                  style={styles.backButton}
                >
                  Back to Login
                </Button>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    padding: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 25,
  },
  submitButtonContent: {
    height: 48,
  },
  backButton: {
    marginTop: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  error: {
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  successText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
});