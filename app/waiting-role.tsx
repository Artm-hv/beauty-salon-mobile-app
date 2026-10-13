import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '../context/AppSettingsContext';
import { authService } from '../services/authService';
import { apiClient } from '../services/api';

/**
 * Екран 2: Очікування підтвердження ролі (WaitingForRoleScreen)
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export default function WaitingForRoleScreen() {
  const router = useRouter();
  const { colors, t } = useAppSettings();
  const currentUser = authService.getCurrentUser();

  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Реальна перевірка статусу ролі (polling через API)
  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage('');

    try {
      const allUsers = await apiClient.getUsers();
      const current = currentUser || authService.getCurrentUser();
      const me = allUsers.find(
        (u) =>
          u.id === current?.id ||
          (current?.email && u.email.toLowerCase() === current.email.toLowerCase())
      );

      if (me) {
        authService.setCurrentUser(me);
        if (me.role !== 'PENDING') {
          setChecking(false);
          router.replace('/(tabs)/calendar');
          return;
        }
      }
    } catch {}

    setChecking(false);
    setStatusMessage(t.waiting.pendingNotice);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleCheckStatus();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Демо-функція для захисту перед викладачем: імітація надання ролі адміністратором
  const handleSimulateRoleApproved = () => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        role: 'MASTER' as const,
      };
      authService.setCurrentUser(updatedUser);
      router.replace('/(tabs)/calendar');
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Surface
        style={[
          styles.contentCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
        ]}
        elevation={2}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceLight }]}>
          <MaterialCommunityIcons name="clock-time-five-outline" size={56} color={colors.primary} />
        </View>

        <Badge style={styles.pendingBadge} size={28}>
          {t.waiting.statusBadge}
        </Badge>

        <Text variant="headlineSmall" style={[styles.title, { color: colors.text }]}>
          {t.waiting.title}
        </Text>

        <Text variant="bodyMedium" style={[styles.description, { color: colors.textSecondary }]}>
          {t.waiting.description1}
          <Text style={[styles.boldText, { color: colors.primary }]}>{t.waiting.studioName}</Text>.
        </Text>

        <Text variant="bodyMedium" style={[styles.subDescription, { color: colors.textSecondary }]}>
          {t.waiting.description2}
        </Text>

        {currentUser && (
          <Surface
            style={[
              styles.userInfoBox,
              { backgroundColor: colors.surfaceLight, borderColor: colors.divider },
            ]}
            elevation={0}
          >
            <Text variant="labelMedium" style={[styles.userLabel, { color: colors.textSecondary }]}>
              {t.waiting.accountLabel}
            </Text>
            <Text variant="bodyMedium" style={[styles.userName, { color: colors.text }]}>
              {currentUser.firstName} {currentUser.lastName}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {currentUser.email}
            </Text>
          </Surface>
        )}

        {!!statusMessage && (
          <Text
            variant="bodySmall"
            style={[
              styles.statusNotice,
              { backgroundColor: colors.surfaceLight, color: colors.primary },
            ]}
          >
            {statusMessage}
          </Text>
        )}

        <Button
          mode="contained"
          icon="refresh"
          onPress={handleCheckStatus}
          loading={checking}
          disabled={checking}
          style={styles.actionButton}
          buttonColor={colors.primary}
          textColor="#000000"
        >
          {t.waiting.checkStatus}
        </Button>

        {/* Кнопка демонстрації для викладача */}
        <Button
          mode="outlined"
          icon="shield-check"
          onPress={handleSimulateRoleApproved}
          style={styles.demoButton}
          textColor="#10B981"
        >
          {t.waiting.demoApprove}
        </Button>

        <Button
          mode="text"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor={colors.textSecondary}
        >
          {t.waiting.logout}
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  contentCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontWeight: 'bold',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  subDescription: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  userInfoBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 11,
  },
  userName: {
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusNotice: {
    textAlign: 'center',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    width: '100%',
  },
  actionButton: {
    width: '100%',
    borderRadius: 10,
    marginBottom: 10,
  },
  demoButton: {
    width: '100%',
    borderRadius: 10,
    borderColor: '#10B981',
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 4,
  },
});
