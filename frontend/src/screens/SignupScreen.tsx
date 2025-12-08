import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { request } from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../store/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { setStoredToken } from '../utils/authStorage';
import FarmerRegistrationForm, { FarmerFormData } from '../components/FarmerRegistrationForm';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type SignupResponse = {
  token: string;
  user: {
    id: string;
    first_name: string;
    email: string;
    role: string;
    approval_status: string;
    email_verified: boolean;
  };
};

export default function SignupScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setAppLanguage } = useLanguage();
  // Hide the navigation header
  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [countryCode, setCountryCode] = useState('+237');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const handleLanguageChange = async (value: 'fr' | 'en') => {
    setLanguage(value);
    await setAppLanguage(value);
  };
  const [farmerData, setFarmerData] = useState<FarmerFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const { setUser } = useApp();

  // Update password validation in real-time
  React.useEffect(() => {
    setPasswordValidation({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [password]);
  const theme = useTheme();

  // Country code list (small set of common countries; extend as needed)
  const countryCodes = [
    { code: '+237', label: 'Cameroon' },
    { code: '+234', label: 'Nigeria' },
    { code: '+233', label: 'Ghana' },
    { code: '+225', label: 'Côte d\'Ivoire' },
    { code: '+229', label: 'Benin' },
    { code: '+33', label: 'France' },
    { code: '+44', label: 'United Kingdom' },
    { code: '+1', label: 'USA' }
  ];

  // Load stored country code (persist selection)
  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('phoneCountryCode');
        if (stored) setCountryCode(stored);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const onCountryCodeChange = async (val: string) => {
    setCountryCode(val);
    try {
      await AsyncStorage.setItem('phoneCountryCode', val);
    } catch (e) {
      // ignore
    }
  };

  const validateBasicInfo = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError(t('auth.validation.required'));
      return false;
    }

    if (!email.includes('@')) {
      setError(t('auth.validation.email'));
      return false;
    }

    const isPasswordValid =
      passwordValidation.hasUpperCase &&
      passwordValidation.hasLowerCase &&
      passwordValidation.hasNumber &&
      passwordValidation.hasSpecialChar;

    if (!isPasswordValid) {
      setError(t('auth.validation.passwordRequirements.title'));
      return false;
    }

    if (password.length < 6) {
      setError(t('auth.validation.passwordMinLength', { count: 6 } as any));
      return false;
    }

    if (password !== confirmPassword) {
      setError(t('auth.validation.passwordMatch'));
      return false;
    }

    return true;
  };

  const handleBasicInfoNext = () => {
    if (validateBasicInfo()) {
      setError(null);
      if (role === 'farmer') {
        setStep(2);
      } else {
        handleSubmit();
      }
    }
  };

  const handleFarmerDataSubmit = (data: FarmerFormData) => {
    setFarmerData(data);
    handleSubmit(data);
  };

  const handleSubmit = async (explicitFarmerData?: FarmerFormData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const finalFarmerData = explicitFarmerData || farmerData;

      if (role === 'farmer' && !finalFarmerData) {
        setError('Please complete the farmer registration form');
        setLoading(false);
        return;
      }

      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
        preferred_language: language,
        phone_number: phoneNumber && phoneNumber.trim() !== '' ? `${countryCode}${phoneNumber}` : 'Not provided',
        country_code: countryCode,
        address: address && address.trim() !== '' ? address : 'Not provided',
        region: region && region.trim() !== '' ? region : 'Not provided',
        ...(role === 'farmer' && finalFarmerData && {
          farm_name: finalFarmerData.farmName,
          farm_size_hectares: Number(finalFarmerData.farmSizeHectares),
          farm_location_lat: finalFarmerData.farmLocationLat,
          farm_location_lng: finalFarmerData.farmLocationLng,
          crops_grown: finalFarmerData.cropsGrown,
          farming_experience_years: Number(finalFarmerData.farmingExperienceYears)
        })
      };

      // DEBUG: log the payload sent to backend
      console.log('DEBUG registration payload:', JSON.stringify(payload, null, 2));

      const response = await request<SignupResponse>('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      await setStoredToken(response.token);
      setUser({
        id: response.user.id,
        firstName: response.user.first_name,
        email: response.user.email,
        role: response.user.role,
        approvalStatus: response.user.approval_status,
        emailVerified: response.user.email_verified
      });

      // If farmer, approval_status may be pending
      if (response.user.role === 'farmer' && response.user.approval_status !== 'approved') {
        setSuccess('Registration successful. Your account is pending approval. You can now log in to check status.');
        setTimeout(() => navigation.navigate('Login'), 3000);
        return;
      }

      if (!response.user.email_verified) {
        setSuccess('Registration successful. Please check your email to verify your account.');
        setTimeout(() => navigation.navigate('Login'), 3000);
        return;
      }

      navigation.navigate('Main');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <Title style={styles.headerTitle}>{t('auth.signUp')}</Title>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {step === 1 ? (
            <View style={styles.form}>
              <View style={styles.languagePickerContainer}>
                <Text style={styles.languageLabel}>{t('auth.language.select')}</Text>
                <Picker
                  selectedValue={language}
                  onValueChange={(itemValue) => handleLanguageChange(itemValue)}
                  style={styles.languagePicker}
                >
                  <Picker.Item label={t('auth.language.fr')} value="fr" />
                  <Picker.Item label={t('auth.language.en')} value="en" />
                </Picker>
              </View>
              <View style={styles.phoneRow}>
                <View style={styles.countryPickerWrapper}>
                  <Picker
                    selectedValue={countryCode}
                    onValueChange={(v) => onCountryCodeChange(v as string)}
                    style={styles.countryPicker}
                  >
                    {countryCodes.map(c => (
                      <Picker.Item key={c.code} label={`${c.label} (${c.code})`} value={c.code} />
                    ))}
                  </Picker>
                </View>
                <TextInput
                  label={t('auth.phone')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                />
              </View>

              <TextInput
                label={t('auth.address')}
                value={address}
                onChangeText={setAddress}
                style={styles.input}
              />

              <TextInput
                label={t('auth.region')}
                value={region}
                onChangeText={setRegion}
                style={styles.input}
              />
              <TextInput
                label={t('auth.firstName')}
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
              />

              <TextInput
                label={t('auth.lastName')}
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
              />

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

              <View style={styles.passwordValidation}>
                <Text style={[
                  styles.validationText,
                  passwordValidation.hasUpperCase ? styles.validationSuccess : styles.validationError
                ]}>
                  {t('auth.validation.passwordRequirements.uppercase')} {passwordValidation.hasUpperCase ? '✓' : ''}
                </Text>
                <Text style={[
                  styles.validationText,
                  passwordValidation.hasLowerCase ? styles.validationSuccess : styles.validationError
                ]}>
                  {t('auth.validation.passwordRequirements.lowercase')} {passwordValidation.hasLowerCase ? '✓' : ''}
                </Text>
                <Text style={[
                  styles.validationText,
                  passwordValidation.hasNumber ? styles.validationSuccess : styles.validationError
                ]}>
                  {t('auth.validation.passwordRequirements.number')} {passwordValidation.hasNumber ? '✓' : ''}
                </Text>
                <Text style={[
                  styles.validationText,
                  passwordValidation.hasSpecialChar ? styles.validationSuccess : styles.validationError
                ]}>
                  {t('auth.validation.passwordRequirements.special')} {passwordValidation.hasSpecialChar ? '✓' : ''}
                </Text>
              </View>

              <TextInput
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleBasicInfoNext}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={{ height: 56 }}
                labelStyle={{ fontSize: 16, letterSpacing: 0 }}
              >
                {role === 'farmer' ? t('common.next') : t('auth.signUp')}
              </Button>
            </View>
          ) : (
            <FarmerRegistrationForm
              onSubmit={handleFarmerDataSubmit}
              loading={loading}
            />
          )}

          <View style={styles.loginContainer}>
            <Text>Already have an account? </Text>
            <Button
              onPress={() => navigation.navigate('Login')}
              mode="text"
              compact
            >
              Sign In
            </Button>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          {success ? (
            <Text style={styles.successText}>{success}</Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    paddingTop: 100,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  countryPickerWrapper: {
    width: 140,
    marginRight: 8
  },
  countryPicker: {
    height: 56,
    width: '100%'
  },
  phoneInput: {
    flex: 1
  },
  form: {
    marginBottom: 24
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 8,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: 16
  },
  successText: {
    color: '#2E7D32',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: 'bold'
  },
  passwordValidation: {
    marginBottom: 16,
    paddingHorizontal: 8
  },
  validationText: {
    fontSize: 14,
    marginBottom: 4
  },
  validationSuccess: {
    color: '#2E7D32'
  },
  validationError: {
    color: '#757575'
  },
  languagePickerContainer: {
    marginBottom: 16,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    padding: 8
  },
  languageLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666'
  },
  languagePicker: {
    backgroundColor: '#fff',
    borderRadius: 4
  }
});