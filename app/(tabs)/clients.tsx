import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Colors } from '../../constants/colors';

/**
 * Екран 7: CRM-база клієнтів
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function ClientsScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Клієнти салону" subtitle="Модуль у розробці (Артем Г)" />
        <Card.Content>
          <Text variant="bodyMedium">
            CRM картотека постійних клієнтів, історія та LTV-метрики.
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
