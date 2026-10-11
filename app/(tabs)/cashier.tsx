import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { OrderCard } from '../../components/OrderCard';
import { OrderItem } from '../../services/mockData';
import { apiClient } from '../../services/api';

type OrderStatusTab = 'ALL' | 'UNPAID' | 'COMPLETED' | 'CANCELLED';

/**
 * Екран: Замовлення (Каса)
 * Зона відповідальності: Розробник 2 (Артем Гіжовський)
 * Підключено збереження та зміну статусів замовлень (GET, POST, PUT)
 */
export default function CashierScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatusTab>('ALL');
  const [dateRange, setDateRange] = useState('10 вер 2026 р. - 11 жовт 2026 р.');
  const [selectedExecutor, setSelectedExecutor] = useState('Всі виконавці');
  const [searchQuery, setSearchQuery] = useState('');
  const [ordersList, setOrdersList] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Завантаження замовлень з REST API (GET /api/orders)
  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiClient.getOrders();
      setOrdersList(data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // Фільтрація замовлень
  const filteredOrders = useMemo(() => {
    return ordersList.filter((ord) => {
      // Фільтр за табами
      if (activeTab === 'UNPAID' && ord.status !== 'UNPAID') return false;
      if (activeTab === 'COMPLETED' && ord.status !== 'COMPLETED') return false;
      if (activeTab === 'CANCELLED' && ord.status !== 'CANCELLED') return false;

      // Фільтр за виконавцем / касиром
      if (selectedExecutor !== 'Всі виконавці' && ord.cashierName !== selectedExecutor) {
        return false;
      }

      // Пошук за номером, клієнтом або послугою
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = ord.orderNumber.toLowerCase().includes(q);
        const matchClient = ord.clientName.toLowerCase().includes(q);
        const matchService = ord.services.some((s) => s.toLowerCase().includes(q));
        return matchNumber || matchClient || matchService;
      }
      return true;
    });
  }, [ordersList, activeTab, selectedExecutor, searchQuery]);

  // Дії із замовленням (перевірка PUT методу)
  const handleOrderPress = (order: OrderItem) => {
    Alert.alert(
      `Замовлення ${order.orderNumber}`,
      `Статус: ${order.status === 'COMPLETED' ? 'Сплачено' : order.status === 'UNPAID' ? 'Очікує оплати' : 'Скасовано'}\nКлієнт: ${order.clientName}\nАдміністратор: ${order.cashierName}\nСума: ${order.totalAmount} ₴\nПослуги:\n• ${order.services.join('\n• ')}`,
      [
        {
          text: 'Сплачено (PUT)',
          onPress: async () => {
            await apiClient.updateOrderStatus(order.id, 'COMPLETED');
            fetchOrders();
          },
        },
        {
          text: 'Скасувати чек (PUT)',
          style: 'destructive',
          onPress: async () => {
            await apiClient.updateOrderStatus(order.id, 'CANCELLED');
            fetchOrders();
          },
        },
        { text: 'Закрити', style: 'cancel' },
      ]
    );
  };

  const handleDateFilterPress = () => {
    Alert.alert('Період замовлень', 'Оберіть часовий проміжок для перегляду оплат', [
      { text: 'Сьогодні (10 жовт 2026 р.)', onPress: () => setDateRange('10 жовт 2026 р.') },
      { text: 'Останній місяць', onPress: () => setDateRange('10 вер 2026 р. - 11 жовт 2026 р.') },
      { text: 'Скасувати', style: 'cancel' },
    ]);
  };

  const handleExecutorFilterPress = () => {
    Alert.alert('Адміністратор', 'Фільтрувати чеки за адміністратором', [
      { text: 'Всі адміністратори', onPress: () => setSelectedExecutor('Всі виконавці') },
      { text: 'Артем Гіжовський (Адміністратор)', onPress: () => setSelectedExecutor('Артем Гіжовський (Адміністратор)') },
      { text: 'Ігор Намачинський', onPress: () => setSelectedExecutor('Ігор Намачинський') },
      { text: 'Артем Лабунський', onPress: () => setSelectedExecutor('Артем Лабунський') },
      { text: 'Скасувати', style: 'cancel' },
    ]);
  };

  const handleCreateOrder = () => {
    Alert.alert(
      'Нове замовлення',
      'Бажаєте створити чек на касі чи перейти до детального бронювання?',
      [
        { text: 'Нове бронювання', onPress: () => router.push('/(tabs)/new-booking') },
        {
          text: 'Швидкий чек (700 ₴)',
          onPress: async () => {
            await apiClient.createOrder({
              totalAmount: 700,
              services: ['Комплексний манікюр + покриття'],
              clientName: 'Гість салону',
              cashierName: 'Артем Гіжовський (Адміністратор)',
              status: 'COMPLETED',
            });
            fetchOrders();
          },
        },
        { text: 'Скасувати', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Верхня плашка: кнопка оновлення даних */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={fetchOrders}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Заголовок "Замовлення" */}
      <Text style={styles.screenTitle}>Замовлення</Text>

      {/* 3. Сегментований перемикач статусів (Всі, Не сплачено, Завершено, Скасовано) */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'ALL' && styles.segmentTabActive]}
          onPress={() => setActiveTab('ALL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'ALL' && styles.segmentTextActive]}>
            Всі
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'UNPAID' && styles.segmentTabActive]}
          onPress={() => setActiveTab('UNPAID')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'UNPAID' && styles.segmentTextActive]}>
            Не сплачено
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'COMPLETED' && styles.segmentTabActive]}
          onPress={() => setActiveTab('COMPLETED')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'COMPLETED' && styles.segmentTextActive]}>
            Завершено
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'CANCELLED' && styles.segmentTabActive]}
          onPress={() => setActiveTab('CANCELLED')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'CANCELLED' && styles.segmentTextActive]}>
            Скасовано
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Фільтр дат */}
      <View style={styles.filterPillWrapper}>
        <TouchableOpacity
          style={styles.filterPill}
          activeOpacity={0.75}
          onPress={handleDateFilterPress}
        >
          <Text style={styles.filterPillText}>{dateRange}</Text>
          <MaterialCommunityIcons name="menu-down" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 6. Пошук */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Пошук чека за клієнтом або послугою"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <MaterialCommunityIcons name="magnify" size={22} color="#8E8E93" />
        </View>
      </View>

      {/* 7. Список карток замовлень */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Завантаження замовлень...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="cash-register" size={44} color="#8E8E93" />
            </View>
            <Text style={styles.emptyTitle}>Замовлень не знайдено</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'Нічого не відповідає вашому запиту'
                : 'Тут з\'являтимуться чеки після створення записів у календарі або швидких оплат'}
            </Text>
          </View>
        ) : (
          filteredOrders.map((ord) => (
            <OrderCard
              key={ord.id}
              order={ord}
              onPress={() => handleOrderPress(ord)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 44,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F1F23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E22',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 3,
    height: 42,
  },
  segmentTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentTabActive: {
    backgroundColor: '#34343A',
  },
  segmentText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillWrapper: {
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  filterPillText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '500',
  },
  searchRow: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  scrollList: {
    paddingBottom: 95,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingTop: 50,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E1E22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
