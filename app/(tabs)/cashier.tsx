import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OrderCard } from '../../components/OrderCard';
import { MOCK_ORDERS, OrderItem } from '../../services/mockData';

type OrderStatusTab = 'ALL' | 'UNPAID' | 'COMPLETED' | 'CANCELLED';

/**
 * Екран 4: Замовлення (Каса) за точним скріншотом EasyWeek
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function CashierScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatusTab>('ALL');
  const [dateRange, setDateRange] = useState('10 вер 2026 р. - 11 жовт 2026 р.');
  const [selectedExecutor, setSelectedExecutor] = useState('Всі виконавці');
  const [searchQuery, setSearchQuery] = useState('');
  const [ordersList, setOrdersList] = useState<OrderItem[]>(MOCK_ORDERS);

  // Фільтрація замовлень
  const filteredOrders = useMemo(() => {
    return ordersList.filter((ord) => {
      // Фільтр за табами
      if (activeTab === 'UNPAID' && ord.status !== 'UNPAID') return false;
      if (activeTab === 'COMPLETED' && ord.status !== 'COMPLETED') return false;
      if (activeTab === 'CANCELLED' && ord.status !== 'CANCELLED') return false;

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
  }, [ordersList, activeTab, searchQuery]);

  const handleOrderPress = (order: OrderItem) => {
    Alert.alert(
      `Замовлення ${order.orderNumber}`,
      `Статус: ${order.status}\nКлієнт: ${order.clientName}\nКасир: ${order.cashierName}\nСума: ${order.totalAmount} ₴\nПослуги:\n• ${order.services.join('\n• ')}`,
      [
        { text: 'Друк чека', onPress: () => Alert.alert('Чек', 'Чек надіслано на друк') },
        { text: 'Закрити', style: 'cancel' },
      ]
    );
  };

  const handleDateFilterPress = () => {
    Alert.alert('Період замовлень', 'Оберіть часовий проміжок для перегляду оплат', [
      { text: 'Сьогодні', onPress: () => setDateRange('10 жовт 2026 р.') },
      { text: 'Останній місяць', onPress: () => setDateRange('10 вер 2026 р. - 11 жовт 2026 р.') },
      { text: 'Скасувати', style: 'cancel' },
    ]);
  };

  const handleExecutorFilterPress = () => {
    Alert.alert('Виконавець', 'Фільтрувати чеки за майстром', [
      { text: 'Всі виконавці', onPress: () => setSelectedExecutor('Всі виконавці') },
      { text: 'Юлія Півень', onPress: () => setSelectedExecutor('Юлія Півень') },
      { text: 'Таня Майстер', onPress: () => setSelectedExecutor('Таня Майстер') },
      { text: 'Скасувати', style: 'cancel' },
    ]);
  };

  const handleCreateOrder = () => {
    Alert.alert(
      'Нове замовлення',
      'Бажаєте створити нове замовлення на касі чи перейти до бронювання?',
      [
        { text: 'Нове бронювання', onPress: () => router.push('/(tabs)/new-booking') },
        {
          text: 'Швидкий чек (700 ₴)',
          onPress: () => {
            const newOrd: OrderItem = {
              id: `ord-${Date.now()}`,
              orderNumber: `№${Math.floor(8143 + Math.random() * 20)}`,
              status: 'COMPLETED',
              date: '10 жовт 2026 р. 20:35',
              clientName: 'ольга',
              clientPhone: '+380 67 278 8818',
              cashierName: 'Настя Кобзар',
              itemsCount: 1,
              services: ['Комплексний манікюр + покриття'],
              totalAmount: 700.0,
              paymentMethod: 'CARD',
            };
            setOrdersList([newOrd, ...ordersList]);
          },
        },
        { text: 'Скасувати', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Верхня плашка: кнопка повернення назад */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/calendar')}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
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

      {/* 4. Фільтр дат (10 вер 2026 р. - 11 жовт 2026 р. ▾) */}
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

      {/* 5. Фільтр виконавця (Виконавець ▾) */}
      <View style={styles.filterPillWrapper}>
        <TouchableOpacity
          style={styles.filterPill}
          activeOpacity={0.75}
          onPress={handleExecutorFilterPress}
        >
          <Text style={styles.filterPillText}>
            {selectedExecutor === 'Всі виконавці' ? 'Виконавець' : selectedExecutor}
          </Text>
          <MaterialCommunityIcons name="menu-down" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 6. Пошук */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Пошук"
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
      >
        {filteredOrders.map((ord) => (
          <OrderCard
            key={ord.id}
            order={ord}
            onPress={() => handleOrderPress(ord)}
          />
        ))}
      </ScrollView>

      {/* 8. Плаваюча кнопка "🛒 Нове замовлення" (FAB) */}
      <TouchableOpacity
        style={styles.fabButton}
        activeOpacity={0.85}
        onPress={handleCreateOrder}
      >
        <MaterialCommunityIcons name="cart-outline" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Нове замовлення</Text>
      </TouchableOpacity>
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
