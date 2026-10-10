import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Colors } from '../../constants/colors';

/**
 * Екран 4: Каса та замовлення
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function CashierScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Каса та замовлення" subtitle="Модуль у розробці (Артем Г)" />
        <Card.Content>
          <Text variant="bodyMedium">
            Реєстр замовлень, чеків та оплат клієнтів салону.
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
