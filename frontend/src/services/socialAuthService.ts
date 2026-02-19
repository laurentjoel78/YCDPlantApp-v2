import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

// Required for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Get redirect URI for OAuth
const redirectUri = makeRedirectUri({
  scheme: 'ycdfarmerguide',
  path: 'auth',
});

console.log('OAuth Redirect URI:', redirectUri);

// OAuth Configuration
// You need to set these in your environment or app.json extra
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId || '';
const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId || '';
const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || '';

export interface SocialAuthResult {
  success: boolean;
  provider: 'google' | 'facebook';
  accessToken?: string;
  idToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  error?: string;
}

/**
 * Hook for Google Sign-In
 */
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  return {
    request,
    response,
    promptAsync,
    isReady: !!request,
  };
}

/**
 * Hook for Facebook Sign-In
 */
export function useFacebookAuth() {
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
    redirectUri,
  });

  return {
    request,
    response,
    promptAsync,
    isReady: !!request,
  };
}

/**
 * Fetch Google user info from access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<SocialAuthResult> {
  try {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const data = await response.json();

    return {
      success: true,
      provider: 'google',
      accessToken,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'google',
      error: error.message,
    };
  }
}

/**
 * Fetch Facebook user info from access token
 */
export async function getFacebookUserInfo(accessToken: string): Promise<SocialAuthResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Facebook user info');
    }

    const data = await response.json();

    return {
      success: true,
      provider: 'facebook',
      accessToken,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture?.data?.url,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      provider: 'facebook',
      error: error.message,
    };
  }
}
