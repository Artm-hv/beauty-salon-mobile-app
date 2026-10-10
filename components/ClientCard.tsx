import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { ClientItem } from '../services/mockData';

interface ClientCardProps {
  client: ClientItem;
  onPress?: () => void;
}

/**
 * Картка клієнта з LTV-метриками для CRM-системи
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export const ClientCard: React.FC<ClientCardProps> = ({ client, onPress }) => {
  const firstLetter = client.name.charAt(0);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.container}>
      <Surface style={styles.card} elevation={1}>
        {/* 1. Верхній рядок: Аватар + Ім'я + Телефон */}
        <View style={styles.topRow}>
          <View style={[styles.avatarCircle, { backgroundColor: client.avatarColor }]}>
            <Text style={styles.avatarLetter}>{firstLetter}</Text>
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientPhone}>{client.phone}</Text>
          </View>

          {client.category === 'VIP' && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>★ VIP</Text>
            </View>
          )}
          {client.category === 'NEW' && (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>НОВИЙ</Text>
            </View>
          )}
        </View>

        {/* 2. Теги клієнта */}
        <View style={styles.tagsRow}>
          {client.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* 3. LTV-аналітика (Візити, Середній чек, Всього сплачено) */}
        <View style={styles.ltvRow}>
          <View style={styles.ltvCol}>
            <Text style={styles.ltvLabel}>Візити</Text>
            <Text style={styles.ltvValue}>{client.visitCount}</Text>
          </View>

          <View style={styles.ltvCol}>
            <Text style={styles.ltvLabel}>Сер. чек</Text>
            <Text style={styles.ltvValue}>{client.averageCheck} ₴</Text>
          </View>

          <View style={[styles.ltvCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.ltvLabel}>Всього (LTV)</Text>
            <Text style={styles.ltvHighlight}>{client.totalSpent} ₴</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#242426',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  clientPhone: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  vipBadge: {
    backgroundColor: 'rgba(198, 138, 44, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C68A2C',
  },
  vipText: {
    color: '#C68A2C',
    fontSize: 11,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  newText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: '#D1D5DB',
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 6,
  },
  ltvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  ltvCol: {
    flex: 1,
  },
  ltvLabel: {
    color: '#8E8E93',
    fontSize: 10,
    marginBottom: 2,
  },
  ltvValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  ltvHighlight: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '700',
  },
});
