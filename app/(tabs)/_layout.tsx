import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Platform, View } from 'react-native';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border.primary,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 16,
          ...theme.shadows.card,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: theme.colors.accent.purple,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="home"
              size={focused ? 26 : 22}
              color={color}
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="brain"
              size={focused ? 26 : 22}
              color={color}
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: 'Battle',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="fist-raised"
              size={focused ? 26 : 22}
              color={color}
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="india-challenge"
        options={{
          title: 'India Challenge',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="flag-usa"
              size={focused ? 26 : 22}
              color={color}
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="medal"
              size={focused ? 26 : 22}
              color={color}
              solid={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="user-ninja"
              size={focused ? 26 : 22}
              color={color}
              solid={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}