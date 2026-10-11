import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { authService, DEMO_ACCOUNTS } from '../services/authService';

/**
 * Екран 0: Авторизація (LoginScreen)
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Валідація полів
  const isEmailValid = () => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Введіть адресу електронної пошти');
      return;
    }
    if (!isEmailValid()) {
      setErrorMessage('Введіть коректну адресу електронної пошти');
      return;
    }
    if (!password) {
      setErrorMessage('Введіть пароль');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(email, password);
      setLoading(false);

      if (result.success && result.user) {
        if (result.user.role === 'PENDING') {
          // Новий користувач очікує активації адміністратором
          router.replace('/waiting-role');
        } else {
          // Майстер або Адміністратор переходять до головного календаря
          router.replace('/(tabs)/calendar');
        }
      } else {
        setErrorMessage(result.error || 'Помилка авторизації');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Не вдалося з’єднатися з сервером');
    }
  };

  // Швидке автозаповнення для показу викладачу
  const fillDemoCredentials = (roleKey: 'master' | 'admin' | 'ihor' | 'labunskyi' | 'pending') => {
    const account = DEMO_ACCOUNTS[roleKey];
    if (account) {
      setEmail(account.email);
      setPassword(account.password);
      setErrorMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Surface style={styles.headerBox} elevation={0}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="spa" size={44} color={Colors.primary} />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            Svoya Nail Studio
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Система управління салоном краси
          </Text>
        </Surface>

        <Surface style={styles.formCard} elevation={2}>
          <Text variant="titleMedium" style={styles.formTitle}>
            Вхід у кабінет працівника
          </Text>

          <TextInput
            label="Електронна пошта"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage('');
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            outlineColor={Colors.cardBorder}
            activeOutlineColor={Colors.primary}
          />
          {!isEmailValid() && (
            <HelperText type="error" visible={!isEmailValid()}>
              Некоректний формат email
            </HelperText>
          )}

          <TextInput
            label="Пароль"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage('');
            }}
            mode="outlined"
            secureTextEntry={!isPasswordVisible}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={isPasswordVisible ? 'eye-off' : 'eye'}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              />
            }
            style={styles.input}
            outlineColor={Colors.cardBorder}
            activeOutlineColor={Colors.primary}
          />

          {!!errorMessage && (
            <HelperText type="error" visible={!!errorMessage} style={styles.errorText}>
              {errorMessage}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            buttonColor={Colors.primary}
            textColor="#000000"
          >
            Увійти
          </Button>

          <Button
            mode="outlined"
            icon="lightning-bolt"
            onPress={() => {
              authService.setCurrentUser(DEMO_ACCOUNTS.master);
              router.replace('/(tabs)/calendar');
            }}
            style={styles.guestButton}
            textColor={Colors.text}
          >
            Миттєвий вхід без пароля (Майстер)
          </Button>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register')}
          >
            <Text variant="bodyMedium" style={styles.registerText}>
              Немає облікового запису?{' '}
              <Text style={styles.registerTextHighlight}>Зареєструватися</Text>
            </Text>
          </TouchableOpacity>
        </Surface>

        {/* Швидкі кнопки демо-входу для показу викладачу */}
        <Surface style={styles.demoSection} elevation={1}>
          <Text variant="labelMedium" style={styles.demoTitle}>
            ⚡ Швидкий демо-вхід для захисту проєкту:
          </Text>
          <View style={styles.demoChipsRow}>
            <Chip
              icon="account"
              onPress={() => fillDemoCredentials('master')}
              style={styles.chip}
            >
              Артем Г.
            </Chip>
            <Chip
              icon="account"
              onPress={() => fillDemoCredentials('ihor')}
              style={styles.chip}
            >
              Ігор Н.
            </Chip>
            <Chip
              icon="account"
              onPress={() => fillDemoCredentials('labunskyi')}
              style={styles.chip}
            >
              Артем Л.
            </Chip>
            <Chip
              icon="shield-account"
              onPress={() => fillDemoCredentials('admin')}
              style={styles.chip}
            >
              Адмін
            </Chip>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  formCard: {
    padding: 22,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  formTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  errorText: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 10,
  },
  guestButton: {
    marginTop: 10,
    borderRadius: 10,
    borderColor: Colors.cardBorder,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  registerLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  registerText: {
    color: Colors.textSecondary,
  },
  registerTextHighlight: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  demoSection: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  demoTitle: {
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: '#F3E8FF',
  },
});
