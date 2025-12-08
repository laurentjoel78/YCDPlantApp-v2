import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      await api.auth.requestPasswordReset(email);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
              Enter your email address and we'll send you instructions to reset your password
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
                  {loading ? <ActivityIndicator animating={true} color="white" /> : 'Send Reset Instructions'}
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
  successText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
});