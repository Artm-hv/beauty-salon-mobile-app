import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ClientItem } from '../constants/salonTypes';
import { useAppSettings } from '../context/AppSettingsContext';

interface ClientCardProps {
  client: ClientItem;
}

/**
 * Картка клієнта CRM за точним макетом EasyWeek
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export const ClientCard: React.FC<ClientCardProps> = ({
  client,
}) => {
  const { colors, t } = useAppSettings();
  const firstLetter = (client.name.charAt(0) || 'К').toUpperCase();

  // Форматування валюти з пробілами (напр. 23 260,00 ₴)
  const formatMoney = (val: number) => {
    const parts = val.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${integerPart},${parts[1]} ₴`;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* 1. Верхній рядок: Аватар + Ім'я з CN-кодом */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: client.avatarColor || '#8B5CF6' }]}>
            <Text style={styles.avatarLetter}>{firstLetter}</Text>
          </View>
          <View style={styles.titleBox}>
            <Text style={[styles.nameText, { color: colors.text }]}>{client.name}</Text>
            <Text style={[styles.cnCodeText, { color: colors.textSecondary }]}>
              {client.cnCode || 'CN-1013'}
            </Text>
          </View>
        </View>
      </View>

      {/* Розділювач */}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* 2. Детальні рядки (Теги, Телефон, Візити, Сер. чек, Оплачено) */}
      <View style={styles.detailsList}>
        {/* Теги */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.clients.tags}</Text>
          <View style={styles.tagLink}>
            <Text style={[styles.tagLinkText, { color: colors.textSecondary }]}>
              {client.tags && client.tags.length > 0 ? client.tags.join(', ') : t.clients.addTags}
            </Text>
          </View>
        </View>

        {/* Телефон */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.clients.phone}</Text>
          <View style={styles.phoneBox}>
            <MaterialCommunityIcons name="check-circle" size={15} color="#4CAF50" />
            <Text style={styles.phoneText}>{client.phone}</Text>
          </View>
        </View>

        {/* Візитів */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.clients.visits}</Text>
          <Text style={[styles.valueCol, { color: colors.text }]}>{client.visitCount}</Text>
        </View>

        {/* Середній чек */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.clients.avgCheck}</Text>
          <Text style={[styles.valueCol, { color: colors.text }]}>{formatMoney(client.averageCheck)}</Text>
        </View>

        {/* Оплачено */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.clients.paid}</Text>
          <Text style={[styles.valueHighlight, { color: colors.text }]}>{formatMoney(client.totalSpent)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C20',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  titleBox: {
    flex: 1,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cnCodeText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#28282D',
    marginVertical: 12,
  },
  detailsList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelCol: {
    color: '#8E8E93',
    fontSize: 13.5,
  },
  tagLink: {
    paddingVertical: 2,
  },
  tagLinkText: {
    color: '#8E8E93',
    fontSize: 13.5,
  },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    color: '#4CAF50',
    fontSize: 13.5,
    fontWeight: '500',
  },
  valueCol: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  valueHighlight: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
