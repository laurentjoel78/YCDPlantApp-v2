import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from './types';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import { SocketProvider } from '../context/SocketContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Import screens
import HomeScreen from '../screens/HomeScreen';
import GuidanceScreen from '../screens/GuidanceScreen';
import ExpertsScreen from '../screens/ExpertsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WeatherScreen from '../screens/WeatherScreen';
import DiseaseDetectionScreen from '../screens/DiseaseDetectionScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import ExpertAdvisoryScreen from '../screens/ExpertAdvisoryScreen';
import ConsultationChatScreen from '../screens/ConsultationChatScreen';
import ForumsScreen from '../screens/ForumsScreen';
import ForumChatScreen from '../screens/ForumChatScreen';
import NewForumPostScreen from '../screens/NewForumPostScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ProductManagementScreen from '../screens/admin/ProductManagementScreen';
import UserApprovalsScreen from '../screens/admin/UserApprovalsScreen';
import AddEditProductScreen from '../screens/admin/AddEditProductScreen';
import ExpertManagementScreen from '../screens/admin/ExpertManagementScreen';
import AddExpertScreen from '../screens/admin/AddExpertScreen';
import ForumManagementScreen from '../screens/admin/ForumManagementScreen';
import CreateForumScreen from '../screens/admin/CreateForumScreen';
import AddProductScreen from '../screens/admin/AddProductScreen';
import ActivityMonitoringScreen from '../screens/admin/ActivityMonitoringScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';

// E-commerce screens
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentModalScreen from '../screens/PaymentModalScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen from '../screens/OrdersScreen';

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2D5016' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="ExpertAdvisory" component={ExpertAdvisoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
      <Stack.Screen name="Forums" component={ForumsScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2D5016' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="ProductManagement" component={ProductManagementScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="UserApprovals" component={UserApprovalsScreen} options={{ title: 'User Approvals' }} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="AddEditProduct" component={AddEditProductScreen} options={{ title: 'Product Form' }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
      <Stack.Screen name="ExpertManagement" component={ExpertManagementScreen} options={{ title: 'Manage Experts' }} />
      <Stack.Screen name="AddExpert" component={AddExpertScreen} options={{ title: 'Add Expert' }} />
      <Stack.Screen name="ForumManagement" component={ForumManagementScreen} options={{ title: 'Manage Forums' }} />
      <Stack.Screen name="CreateForum" component={CreateForumScreen} options={{ title: 'Create Forum' }} />
      <Stack.Screen name="ActivityMonitoring" component={ActivityMonitoringScreen} options={{ title: 'Activity Monitoring' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminStack />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2D5016',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Experts"
        component={ExpertsScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="store" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }: { color: string }) => (
            <MaterialCommunityIcons name="account" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <RootStack.Navigator
      screenOptions={() => ({
        headerStyle: { backgroundColor: '#2D5016' },
        headerTintColor: '#fff',
        headerBackTitle: t('common.back'),
        headerBackVisible: true
      })}
    >
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <RootStack.Screen
            name="DiseaseDetection"
            component={DiseaseDetectionScreen}
            options={{ title: t('navigation.diseaseDetection'), headerShown: true }}
          />
          <RootStack.Screen
            name="ConsultationChat"
            component={ConsultationChatScreen}
            options={{ title: t('navigation.consultation') }}
          />
          <RootStack.Screen
            name="ForumDetails"
            component={ForumChatScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="NewForumPost"
            component={NewForumPostScreen}
            options={{ title: t('navigation.newPost') }}
          />
          <RootStack.Screen
            name="Cart"
            component={CartScreen}
            options={{ title: 'My Cart' }}
          />
          <RootStack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
          />
          <RootStack.Screen
            name="PaymentModal"
            component={PaymentModalScreen}
            options={{ presentation: 'modal', headerShown: false }}
          />
          <RootStack.Screen
            name="OrderSuccess"
            component={OrderSuccessScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'My Orders' }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

const AppNavigator = () => {
  return (
    <SocketProvider>
      <RootNavigator />
    </SocketProvider>
  );
};

export { AppNavigator };