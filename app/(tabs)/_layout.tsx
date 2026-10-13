import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '../../context/AppSettingsContext';
import { authService } from '../../services/authService';

export default function TabsLayout() {
  const { colors, isDark, t } = useAppSettings();
  const currentUser = authService.getCurrentUser();
  const isMaster = currentUser?.role === 'MASTER';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: 75,
          paddingBottom: 12,
          paddingTop: 8,
          paddingHorizontal: isMaster ? 36 : 0, // Гармонійне відцентрування 2 вкладок для майстра
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabs.calendar,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cashier"
        options={{
          href: isMaster ? null : undefined,
          title: t.tabs.cashier,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="wallet-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-booking"
        options={{
          href: isMaster ? null : undefined,
          title: '',
          tabBarIcon: () => (
            <View
              style={[
                styles.centerAddButton,
                { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={26}
                color={isDark ? '#000000' : '#FFFFFF'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: isMaster ? null : undefined,
          title: t.tabs.clients,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.more,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dots-grid" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerAddButton: {
    width: 44,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
});
