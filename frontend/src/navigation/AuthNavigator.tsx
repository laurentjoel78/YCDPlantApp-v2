import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<RootStackParamList>();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2D5016',
        },
        headerTintColor: '#fff',
        headerBackTitle: "Back",
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerTitle: "Sign In",
          headerBackVisible: false 
        }}
      />
      <AuthStack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{ 
          headerTitle: "Create Account"
        }}
      />
      <AuthStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ 
          headerTitle: "Reset Password"
        }}
      />
    </AuthStack.Navigator>
  );
}