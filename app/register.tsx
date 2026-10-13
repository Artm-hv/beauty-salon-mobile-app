import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAppSettings } from '../context/AppSettingsContext';
import { authService } from '../services/authService';

/**
 * Екран 1: Реєстрація нового працівника (RegisterScreen)
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { colors, t, language } = useAppSettings();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isEmailValid = () => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isPasswordMatch = () => {
    if (!confirmPassword) return true;
    return password === confirmPassword;
  };

  const handleRegister = async () => {
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage(t.auth.validationEmptyName);
      return;
    }
    if (!phone.trim()) {
      setErrorMessage(t.auth.validationEmptyPhone);
      return;
    }
    if (!email.trim() || !isEmailValid()) {
      setErrorMessage(t.auth.validationEmail);
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(t.auth.validationPasswordMin);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t.auth.validationPasswordMatch);
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        firstName,
        lastName,
        phone,
        email,
        password,
      });

      setLoading(false);
      if (result.success && result.user) {
        // Новий акаунт створено зі статусом PENDING -> переходимо на екран очікування ролі
        router.replace('/waiting-role');
      } else {
        setErrorMessage(result.error || (language === 'pl' ? 'Błąd rejestracji' : 'Помилка при реєстрації'));
      }
    } catch {
      setLoading(false);
      setErrorMessage(language === 'pl' ? 'Nie udało się połączyć z serwerem' : 'Не вдалося з’єднатися з сервером реєстрації');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.text}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>

        <Surface
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: 1 },
          ]}
          elevation={2}
        >
          <Text variant="headlineSmall" style={[styles.formTitle, { color: colors.text }]}>
            {t.auth.registerTitle}
          </Text>
          <Text variant="bodyMedium" style={[styles.formSubtitle, { color: colors.textSecondary }]}>
            {t.auth.systemSubtitle}
          </Text>

          <View style={styles.row}>
            <TextInput
              label={t.auth.firstNameLabel}
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={[styles.input, styles.halfInput, { backgroundColor: colors.surface }]}
              textColor={colors.text}
              outlineColor={colors.cardBorder}
              activeOutlineColor={colors.primary}
            />
            <TextInput
              label={t.auth.lastNameLabel}
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={[styles.input, styles.halfInput, { backgroundColor: colors.surface }]}
              textColor={colors.text}
              outlineColor={colors.cardBorder}
              activeOutlineColor={colors.primary}
            />
          </View>

          <TextInput
            label={t.auth.phoneLabel}
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone-outline" />}
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.cardBorder}
            activeOutlineColor={colors.primary}
            placeholder="+380..."
          />

          <TextInput
            label={t.auth.emailLabel}
            value={email}
            onChangeText={setEmail}
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
            onChangeText={setPassword}
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

          <TextInput
            label={t.auth.confirmPasswordLabel}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!isPasswordVisible}
            left={<TextInput.Icon icon="lock-check-outline" />}
            style={[styles.input, { backgroundColor: colors.surface }]}
            textColor={colors.text}
            outlineColor={colors.cardBorder}
            activeOutlineColor={colors.primary}
          />
          {!isPasswordMatch() && (
            <HelperText type="error" visible={!isPasswordMatch()}>
              {t.auth.validationPasswordMatch}
            </HelperText>
          )}

          {!!errorMessage && (
            <HelperText type="error" visible={!!errorMessage} style={styles.errorText}>
              {errorMessage}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
            buttonColor={colors.primary}
            textColor="#000000"
          >
            {t.auth.registerButton}
          </Button>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              {t.auth.alreadyAccount}{' '}
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t.auth.loginButton}</Text>
            </Text>
          </TouchableOpacity>
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
    paddingTop: 40,
    justifyContent: 'center',
  },
  topBar: {
    marginBottom: 8,
  },
  backButton: {
    margin: 0,
  },
  formCard: {
    padding: 22,
    borderRadius: 16,
  },
  formTitle: {
    fontWeight: 'bold',
  },
  formSubtitle: {
    marginTop: 4,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 8,
  },
  registerButton: {
    marginTop: 10,
    borderRadius: 10,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  loginLink: {
    marginTop: 18,
    alignItems: 'center',
  },
});
