import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderItem } from '../services/mockData';
import { Colors } from '../constants/colors';

interface OrderCardProps {
  order: OrderItem;
  onPress?: () => void;
}

/**
 * Картка чека/замовлення для екрану Каси
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  // Визначення кольорів та тексту статусу
  const getStatusBadge = () => {
    switch (order.status) {
      case 'COMPLETED':
        return { text: 'Завершено', bg: '#133E1D', color: '#34D399' };
      case 'UNPAID':
        return { text: 'Не сплачено', bg: '#452B07', color: '#FBBF24' };
      case 'CANCELLED':
        return { text: 'Скасовано', bg: '#450A0A', color: '#F87171' };
      default:
        return { text: 'В обробці', bg: '#2C2C2E', color: '#D1D5DB' };
    }
  };

  const badge = getStatusBadge();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.container}>
      <Surface style={styles.card} elevation={1}>
        {/* 1. Верхній рядок: Номер чека + Статус */}
        <View style={styles.topRow}>
          <View style={styles.numberRow}>
            <MaterialCommunityIcons name="receipt" size={18} color="#C68A2C" />
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        {/* 2. Дані клієнта */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={15} color="#8E8E93" />
          <Text style={styles.clientName}>{order.clientName}</Text>
          <Text style={styles.clientPhone}>({order.clientPhone})</Text>
        </View>

        {/* 3. Послуги та кількість позицій */}
        <View style={styles.servicesRow}>
          <MaterialCommunityIcons name="tag-outline" size={14} color="#8E8E93" />
          <Text numberOfLines={1} style={styles.servicesText}>
            {order.services.join(', ')}
          </Text>
        </View>

        {/* 4. Розділювач */}
        <View style={styles.divider} />

        {/* 5. Нижня лінія: Дата і касир зліва, Сума великим шрифтом справа */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.dateText}>{order.date}</Text>
            <Text style={styles.cashierText}>Касир: {order.cashierName}</Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.totalAmount}>{order.totalAmount.toFixed(2)} ₴</Text>
            <Text style={styles.paymentMethod}>
              {order.paymentMethod === 'CARD' ? '💳 Картка' : '💵 Готівка'}
            </Text>
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
    borderRadius: 12,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#242426',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clientPhone: {
    color: '#8E8E93',
    fontSize: 12,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  servicesText: {
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#8E8E93',
    fontSize: 11,
  },
  cashierText: {
    color: '#636366',
    fontSize: 10,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  paymentMethod: {
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 2,
  },
});
