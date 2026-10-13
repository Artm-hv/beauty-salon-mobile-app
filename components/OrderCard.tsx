import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderItem } from '../services/mockData';
import { useAppSettings } from '../context/AppSettingsContext';

interface OrderCardProps {
  order: OrderItem;
  onPress?: () => void;
}

/**
 * Картка замовлення/чека за точним макетом EasyWeek
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const { colors, t } = useAppSettings();

  // Форматування суми
  const formatMoney = (val: number) => {
    const parts = val.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${integerPart},${parts[1]} ₴`;
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'COMPLETED':
        return {
          icon: 'check',
          text: t.cashier.completed,
          bg: '#0E3D1E',
          color: '#4CAF50',
        };
      case 'UNPAID':
        return {
          icon: 'alert-circle-outline',
          text: t.cashier.unpaid,
          bg: '#3B2A08',
          color: '#F59E0B',
        };
      case 'CANCELLED':
        return {
          icon: 'close',
          text: t.cashier.cancelled,
          bg: '#3B1212',
          color: '#EF4444',
        };
      default:
        return {
          icon: 'clock-outline',
          text: t.cashier.unpaid,
          bg: '#242428',
          color: '#A1A1AA',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface }]}
    >
      {/* 1. Верхній рядок: Номер замовлення + Стрілочка */}
      <View style={styles.headerRow}>
        <Text style={[styles.orderTitle, { color: colors.text }]}>
          {t.cashier.order} {order.orderNumber}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      {/* 2. Бейдж статусу (наприклад, ✓ Завершено) */}
      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
        <MaterialCommunityIcons name={badge.icon as any} size={14} color={badge.color} />
        <Text style={[styles.statusText, { color: badge.color }]}>{badge.text}</Text>
      </View>

      {/* Розділювач */}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {/* 3. Деталі (Створено, Клієнт, Касир, Кількість, Всього) */}
      <View style={styles.detailsList}>
        {/* Створено */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.cashier.created}</Text>
          <Text style={[styles.valueCol, { color: colors.text }]}>{order.date}</Text>
        </View>

        {/* Клієнт */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.booking.client}</Text>
          <View style={styles.personBox}>
            <View style={[styles.avatarDot, { backgroundColor: '#8B5CF6' }]}>
              <MaterialCommunityIcons name="account" size={11} color="#FFFFFF" />
            </View>
            <Text style={[styles.personName, { color: colors.text }]}>{order.clientName}</Text>
          </View>
        </View>

        {/* Адміністратор */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.cashier.admin}</Text>
          <View style={styles.personBox}>
            <View style={[styles.avatarDot, { backgroundColor: '#10B981' }]}>
              <MaterialCommunityIcons name="shield-account" size={12} color="#FFFFFF" />
            </View>
            <Text style={[styles.personName, { color: colors.text }]}>{order.cashierName}</Text>
          </View>
        </View>

        {/* Кількість */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.cashier.items}</Text>
          <Text style={[styles.valueCol, { color: colors.text }]}>{order.itemsCount}</Text>
        </View>

        {/* Всього */}
        <View style={styles.detailRow}>
          <Text style={[styles.labelCol, { color: colors.textSecondary }]}>{t.cashier.total}</Text>
          <Text style={[styles.totalAmountText, { color: colors.text }]}>{formatMoney(order.totalAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
  orderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
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
  valueCol: {
    color: '#E5E5EA',
    fontSize: 13.5,
    fontWeight: '500',
  },
  personBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '500',
  },
  totalAmountText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
