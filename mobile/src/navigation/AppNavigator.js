import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';

// Auth screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import AgeVerificationScreen from '../screens/auth/AgeVerificationScreen';

// Main screens
import HomeScreen from '../screens/main/HomeScreen';
import DiscoverScreenMain from '../screens/main/DiscoverScreen';
import LeaderboardScreenMain from '../screens/main/LeaderboardScreen';
import PremiumScreen from '../screens/main/PremiumScreen';

// Chat
import VideoChatScreen from '../screens/chat/VideoChatScreen';

// Store
import CoinStoreScreen from '../screens/store/CoinStoreScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';

// Streaming
import LiveStreamScreen from '../screens/streaming/LiveStreamScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabBar({ state, descriptors, navigation }) {
  const tabs = [
    { name: 'Home', icon: '🏠', label: 'Home' },
    { name: 'Discover', icon: '🔍', label: 'Discover' },
    { name: 'VideoChat', icon: '⚡', label: 'Match', isCenter: true },
    { name: 'Leaderboard', icon: '🏆', label: 'Top' },
    { name: 'Profile', icon: '👤', label: 'Me' },
  ];

  return (
    <View style={styles.tabBar}>
      <LinearGradient
        colors={['rgba(13,13,20,0.95)', '#0A0A0F']}
        style={styles.tabBarGradient}
      >
        {state.routes.map((route, idx) => {
          const tab = tabs[idx];
          const isFocused = state.index === idx;
          const isCenter = tab?.isCenter;

          return (
            <View key={route.key} style={styles.tabItem}>
              {isCenter ? (
                <View
                  style={styles.centerTabWrapper}
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={() => navigation.navigate(route.name)}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#EC4899']}
                    style={styles.centerTab}
                  >
                    <Text style={styles.centerTabIcon}>{tab?.icon}</Text>
                  </LinearGradient>
                </View>
              ) : (
                <View
                  style={styles.tabItemInner}
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={() => navigation.navigate(route.name)}
                >
                  <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                    {tab?.icon}
                  </Text>
                  <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                    {tab?.label}
                  </Text>
                  {isFocused && <View style={styles.tabActiveDot} />}
                </View>
              )}
            </View>
          );
        })}
      </LinearGradient>
    </View>
  );
}



function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreenMain} />
      <Tab.Screen name="VideoChat" component={VideoChatScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreenMain} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="AgeVerification" component={AgeVerificationScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="VideoChat"
          component={VideoChatScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="CoinStore" component={CoinStoreScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen
          name="LiveStreaming"
          component={LiveStreamScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
  },
  tabBarGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabItemInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, position: 'relative' },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  tabLabelActive: { color: colors.primary },
  tabActiveDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  centerTabWrapper: {
    marginBottom: 20,
  },
  centerTab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  centerTabIcon: { fontSize: 26 },
});
