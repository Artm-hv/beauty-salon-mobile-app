import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: 75,
          paddingBottom: 12,
          paddingTop: 8,
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
          title: 'Календар',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cashier"
        options={{
          title: 'Каса',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="wallet-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-booking"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.centerAddButton}>
              <MaterialCommunityIcons name="plus" size={26} color="#000000" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Клієнти',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ще',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
});
