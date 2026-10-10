import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { authService } from '../services/authService';

/**
 * Екран 1: Реєстрація нового працівника (RegisterScreen)
 * Зона відповідальності: Розробник 1 (Ігор)
 */
export default function RegisterScreen() {
  const router = useRouter();

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
      setErrorMessage("Введіть ім'я та прізвище");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Введіть контактний номер телефону');
      return;
    }
    if (!email.trim() || !isEmailValid()) {
      setErrorMessage('Введіть коректну електронну пошту');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Пароль повинен містити щонайменше 6 символів');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Введені паролі не співпадають');
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
        setErrorMessage(result.error || 'Помилка при реєстрації');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Не вдалося з’єднатися з сервером реєстрації');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>

        <Surface style={styles.formCard} elevation={2}>
          <Text variant="headlineSmall" style={styles.formTitle}>
            Реєстрація фахівця
          </Text>
          <Text variant="bodyMedium" style={styles.formSubtitle}>
            Створіть обліковий запис для роботи в салоні
          </Text>

          <View style={styles.row}>
            <TextInput
              label="Ім'я"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              outlineColor={Colors.cardBorder}
              activeOutlineColor={Colors.primary}
            />
            <TextInput
              label="Прізвище"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              outlineColor={Colors.cardBorder}
              activeOutlineColor={Colors.primary}
            />
          </View>

          <TextInput
            label="Номер телефону"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone-outline" />}
            style={styles.input}
            outlineColor={Colors.cardBorder}
            activeOutlineColor={Colors.primary}
            placeholder="+380..."
          />

          <TextInput
            label="Електронна пошта"
            value={email}
            onChangeText={setEmail}
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
            style={styles.input}
            outlineColor={Colors.cardBorder}
            activeOutlineColor={Colors.primary}
          />

          <TextInput
            label="Підтвердження пароля"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!isPasswordVisible}
            left={<TextInput.Icon icon="lock-check-outline" />}
            style={styles.input}
            outlineColor={Colors.cardBorder}
            activeOutlineColor={Colors.primary}
          />
          {!isPasswordMatch() && (
            <HelperText type="error" visible={!isPasswordMatch()}>
              Паролі не співпадають
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
            buttonColor={Colors.primary}
          >
            Створити обліковий запис
          </Button>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text variant="bodyMedium" style={styles.loginText}>
              Вже є обліковий запис?{' '}
              <Text style={styles.loginTextHighlight}>Увійти</Text>
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.surface,
  },
  formTitle: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  formSubtitle: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
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
  loginText: {
    color: Colors.textSecondary,
  },
  loginTextHighlight: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
