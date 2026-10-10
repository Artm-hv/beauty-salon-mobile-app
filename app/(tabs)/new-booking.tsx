import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Colors } from '../../constants/colors';

/**
 * Екран 5: Оформлення нового запису
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function NewBookingScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Новий запис" subtitle="Модуль у розробці (Артем Г)" />
        <Card.Content>
          <Text variant="bodyMedium">
            Форма створення запису клієнта: вибір послуги, майстра та слоту.
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
