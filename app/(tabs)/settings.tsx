import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Colors } from '../../constants/colors';

/**
 * Екран 8: Меню налаштувань ("Ще")
 * Зона відповідальності: Розробник 3 (Артем Л)
 */
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Налаштування" subtitle="Модуль у розробці (Артем Л)" />
        <Card.Content>
          <Text variant="bodyMedium">
            Керування персоналом, статистика, зарплати та перемикач мови (PL/UA).
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
  },
});
