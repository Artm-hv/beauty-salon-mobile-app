import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { authService } from '../services/authService';

/**
 * Екран 2: Очікування підтвердження ролі (WaitingForRoleScreen)
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export default function WaitingForRoleScreen() {
  const router = useRouter();
  const currentUser = authService.getCurrentUser();

  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Перевірка статусу ролі (polling)
  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage('');

    // Імітація запиту до GET /api/auth/me або перевірки профілю
    setTimeout(() => {
      setChecking(false);
      const user = authService.getCurrentUser();

      if (user && user.role !== 'PENDING') {
        // Роль надано (MASTER або ADMIN) -> перехід у робочий простір
        router.replace('/(tabs)/calendar');
      } else {
        setStatusMessage('Роль ще не призначено. Обліковий запис очікує підтвердження адміністратора.');
      }
    }, 800);
  };

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
    <ScrollView contentContainerStyle={styles.container}>
      <Surface style={styles.contentCard} elevation={2}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="clock-time-five-outline" size={56} color={Colors.primary} />
        </View>

        <Badge style={styles.pendingBadge} size={28}>
          СТАТУС: ОЧІКУЄ ПІДТВЕРДЖЕННЯ
        </Badge>

        <Text variant="headlineSmall" style={styles.title}>
          Очікування підтвердження ролі
        </Text>

        <Text variant="bodyMedium" style={styles.description}>
          Ваш обліковий запис успішно зареєстровано в системі салону{' '}
          <Text style={styles.boldText}>"Svoya Nail Studio"</Text>.
        </Text>

        <Text variant="bodyMedium" style={styles.subDescription}>
          З міркувань безпеки доступ до розкладу та бази клієнтів надається лише після перевірки
          адміністратором. Будь ласка, зверніться до керівника або зачекайте активації.
        </Text>

        {currentUser && (
          <Surface style={styles.userInfoBox} elevation={0}>
            <Text variant="labelMedium" style={styles.userLabel}>
              Обліковий запис:
            </Text>
            <Text variant="bodyMedium" style={styles.userName}>
              {currentUser.firstName} {currentUser.lastName}
            </Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {currentUser.email}
            </Text>
          </Surface>
        )}

        {!!statusMessage && (
          <Text variant="bodySmall" style={styles.statusNotice}>
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
          buttonColor={Colors.primary}
        >
          Перевірити статус
        </Button>

        {/* Кнопка демонстрації для викладача */}
        <Button
          mode="outlined"
          icon="shield-check"
          onPress={handleSimulateRoleApproved}
          style={styles.demoButton}
          textColor={Colors.statusCompleted}
        >
          [Демо викладачу] Схвалити роль (Майстер)
        </Button>

        <Button
          mode="text"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor={Colors.textSecondary}
        >
          Вийти з облікового запису
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  contentCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E8FF',
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  subDescription: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  userInfoBox: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 16,
    alignItems: 'center',
  },
  userLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  userName: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  userEmail: {
    color: Colors.textSecondary,
  },
  statusNotice: {
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#F3E8FF',
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
    borderColor: Colors.statusCompleted,
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 4,
  },
});
