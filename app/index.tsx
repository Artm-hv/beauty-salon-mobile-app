import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '../context/AppSettingsContext';
import { authService, DEMO_ACCOUNTS } from '../services/authService';

/**
 * Екран 0: Авторизація (LoginScreen)
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export default function LoginScreen() {
  const router = useRouter();
  const { colors, t, language, setLanguage, isDark, toggleTheme } = useAppSettings();

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
      setErrorMessage(t.auth.validationEmptyEmail);
      return;
    }
    if (!isEmailValid()) {
      setErrorMessage(t.auth.validationEmail);
      return;
    }
    if (!password) {
      setErrorMessage(t.auth.validationEmptyPassword);
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
        setErrorMessage(result.error || (language === 'pl' ? 'Błąd autoryzacji' : 'Помилка авторизації'));
      }
    } catch {
      setLoading(false);
      setErrorMessage(language === 'pl' ? 'Nie udało się połączyć z serwerem' : 'Не вдалося з’єднатися з сервером');
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
      style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Верхній блок швидкого перемикання мови та теми на екрані входу */}
        <View style={styles.topUtilityRow}>
          <TouchableOpacity
            style={[styles.langToggleBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            onPress={() => setLanguage(language === 'pl' ? 'ua' : 'pl')}
          >
            <MaterialCommunityIcons name="translate" size={16} color={colors.text} />
            <Text style={[styles.langToggleText, { color: colors.text }]}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-night' : 'weather-sunny'}
              size={18}
              color={isDark ? '#F59E0B' : '#EAB308'}
            />
          </TouchableOpacity>
        </View>

        <Surface style={styles.headerBox} elevation={0}>
          <View style={[styles.logoCircle, { backgroundColor: colors.surfaceLight }]}>
            <MaterialCommunityIcons name="spa" size={44} color={colors.primary} />
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: colors.text }]}>
            {t.auth.systemTitle}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.auth.systemSubtitle}
          </Text>
        </Surface>

        <Surface
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
          ]}
          elevation={2}
        >
          <Text variant="titleMedium" style={[styles.formTitle, { color: colors.text }]}>
            {t.auth.loginTitle}
          </Text>

          <TextInput
            label={t.auth.emailLabel}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage('');
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.cardBorder}
            activeOutlineColor={colors.primary}
          />
          {!isEmailValid() && (
            <HelperText type="error" visible={!isEmailValid()}>
              {t.auth.validationEmail}
            </HelperText>
          )}

          <TextInput
            label={t.auth.passwordLabel}
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
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.cardBorder}
            activeOutlineColor={colors.primary}
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
            buttonColor={colors.primary}
            textColor="#000000"
          >
            {t.auth.loginButton}
          </Button>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register')}
          >
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              {t.auth.noAccount}{' '}
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t.auth.registerLink}</Text>
            </Text>
          </TouchableOpacity>
        </Surface>

        {/* Швидкі кнопки демо-входу для показу викладачу */}
        <Surface
          style={[
            styles.demoSection,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
          ]}
          elevation={1}
        >
          <Text variant="labelMedium" style={[styles.demoTitle, { color: colors.textSecondary }]}>
            {t.auth.demoTitle}
          </Text>
          <View style={styles.demoChipsRow}>
            <Chip
              icon="account"
              onPress={() => fillDemoCredentials('master')}
              style={[styles.chip, { backgroundColor: colors.surfaceLight }]}
              textStyle={{ color: colors.text }}
            >
              Артем Г.
            </Chip>
            <Chip
              icon="account"
              onPress={() => fillDemoCredentials('ihor')}
              style={[styles.chip, { backgroundColor: colors.surfaceLight }]}
              textStyle={{ color: colors.text }}
            >
              Ігор Н.
            </Chip>
            <Chip
              icon="account"
              onPress={() => fillDemoCredentials('labunskyi')}
              style={[styles.chip, { backgroundColor: colors.surfaceLight }]}
              textStyle={{ color: colors.text }}
            >
              Артем Л.
            </Chip>
            <Chip
              icon="shield-account"
              onPress={() => fillDemoCredentials('admin')}
              style={[styles.chip, { backgroundColor: colors.surfaceLight }]}
              textStyle={{ color: colors.text }}
            >
              {language === 'pl' ? 'Admin' : 'Адмін'}
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
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  topUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
  },
  formCard: {
    padding: 22,
    borderRadius: 16,
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 10,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  registerLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  demoSection: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoTitle: {
    marginBottom: 8,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    borderRadius: 16,
  },
});
