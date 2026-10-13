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
import { useAppSettings } from '../../context/AppSettingsContext';
import { authService } from '../../services/authService';

type OrderStatusTab = 'ALL' | 'UNPAID' | 'COMPLETED' | 'CANCELLED';

/**
 * Екран: Замовлення (Каса)
 * Зона відповідальності: Розробник 2 (Артем Гіжовський)
 * Підключено збереження та зміну статусів замовлень (GET, POST, PUT)
 */
export default function CashierScreen() {
  const router = useRouter();
  const { colors, t, language } = useAppSettings();
  const currentUser = authService.getCurrentUser();
  const currentRawName = currentUser
    ? (currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`.trim())
    : 'Адміністратор салону';
  const currentUserName = currentUser
    ? `${currentRawName} (${currentUser.role === 'ADMIN' ? (language === 'pl' ? 'Administrator' : 'Адміністратор') : (language === 'pl' ? 'Mistrz' : 'Майстер')})`
    : 'Адміністратор салону';

  const [activeTab, setActiveTab] = useState<OrderStatusTab>('ALL');
  const [dateRange, setDateRange] = useState(
    language === 'pl' ? '10 wrz 2026 r. - 11 paź 2026 r.' : '10 вер 2026 р. - 11 жовт 2026 р.'
  );
  const [selectedExecutor, setSelectedExecutor] = useState('ALL');
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
      if (
        selectedExecutor !== 'ALL' &&
        !ord.cashierName.toLowerCase().includes(selectedExecutor.toLowerCase())
      ) {
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
      `${t.cashier.order} ${order.orderNumber}`,
      `${language === 'pl' ? 'Status' : 'Статус'}: ${order.status === 'COMPLETED' ? t.cashier.completed : order.status === 'UNPAID' ? t.cashier.unpaid : t.cashier.cancelled}\n${t.booking.client}: ${order.clientName}\n${t.cashier.admin}: ${order.cashierName}\n${t.cashier.total}: ${order.totalAmount} ₴\n${t.booking.services}:\n• ${order.services.join('\n• ')}`,
      [
        {
          text: t.cashier.markPaid,
          onPress: async () => {
            await apiClient.updateOrderStatus(order.id, 'COMPLETED');
            fetchOrders();
          },
        },
        {
          text: t.cashier.cancelReceipt,
          style: 'destructive',
          onPress: async () => {
            await apiClient.updateOrderStatus(order.id, 'CANCELLED');
            fetchOrders();
          },
        },
        { text: t.common.cancel, style: 'cancel' },
      ]
    );
  };

  const handleDateFilterPress = () => {
    Alert.alert(
      language === 'pl' ? 'Okres rozliczeniowy' : 'Період замовлень',
      language === 'pl' ? 'Wybierz przedział czasowy' : 'Оберіть часовий проміжок для перегляду оплат',
      [
        {
          text: language === 'pl' ? 'Dziś (10 paź 2026 r.)' : 'Сьогодні (10 жовт 2026 р.)',
          onPress: () => setDateRange(language === 'pl' ? '10 paź 2026 r.' : '10 жовт 2026 р.'),
        },
        {
          text: language === 'pl' ? 'Ostatni miesiąc' : 'Останній місяць',
          onPress: () =>
            setDateRange(
              language === 'pl'
                ? '10 wrz 2026 r. - 11 paź 2026 r.'
                : '10 вер 2026 р. - 11 жовт 2026 р.'
            ),
        },
        { text: t.common.cancel, style: 'cancel' },
      ]
    );
  };

  const handleExecutorFilterPress = async () => {
    const masters = await apiClient.getMasters();
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[] = [
      {
        text: t.cashier.allExecutors,
        onPress: () => setSelectedExecutor('ALL'),
      },
    ];

    if (currentUser) {
      options.push({
        text: `${t.cashier.myOrders} (${currentRawName})`,
        onPress: () => setSelectedExecutor(currentRawName),
      });
    }

    masters.forEach((m) => {
      if (m.name !== currentRawName) {
        options.push({
          text: m.name,
          onPress: () => setSelectedExecutor(m.name),
        });
      }
    });

    options.push({ text: t.common.cancel, style: 'cancel' });

    Alert.alert(
      language === 'pl' ? 'Pracownicy' : 'Персонал',
      language === 'pl' ? 'Filtruj paragony według pracownika' : 'Фільтрувати чеки за працівником',
      options
    );
  };

  const handleCreateOrder = () => {
    Alert.alert(
      language === 'pl' ? 'Nowe zamówienie' : 'Нове замовлення',
      language === 'pl'
        ? 'Utwórz szybki paragon lub przejdź do rezerwacji:'
        : 'Бажаєте створити чек на касі чи перейти до детального бронювання?',
      [
        {
          text: language === 'pl' ? 'Nowa rezerwacja' : 'Нове бронювання',
          onPress: () => router.push('/(tabs)/new-booking'),
        },
        {
          text: `${language === 'pl' ? 'Szybki paragon' : 'Швидкий чек'} (700 ₴)`,
          onPress: async () => {
            await apiClient.createOrder({
              totalAmount: 700,
              services: [language === 'pl' ? 'Kompleksowy manicure + hybryda' : 'Комплексний манікюр + покриття'],
              clientName: language === 'pl' ? 'Klient salonu' : 'Гість салону',
              cashierName: currentUserName,
              status: 'COMPLETED',
            });
            fetchOrders();
          },
        },
        { text: t.common.cancel, style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Верхня плашка: кнопка оновлення даних */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceLight }]}
          activeOpacity={0.7}
          onPress={fetchOrders}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. Заголовок "Замовлення" */}
      <Text style={[styles.screenTitle, { color: colors.text }]}>{t.cashier.title}</Text>

      {/* 3. Сегментований перемикач статусів (Всі, Не сплачено, Завершено, Скасовано) */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceLight }]}>
        <TouchableOpacity
          style={[
            styles.segmentTab,
            activeTab === 'ALL' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
          ]}
          onPress={() => setActiveTab('ALL')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'ALL' ? colors.text : colors.textSecondary },
              activeTab === 'ALL' && styles.segmentTextActive,
            ]}
          >
            {t.cashier.all}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentTab,
            activeTab === 'UNPAID' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
          ]}
          onPress={() => setActiveTab('UNPAID')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'UNPAID' ? colors.text : colors.textSecondary },
              activeTab === 'UNPAID' && styles.segmentTextActive,
            ]}
          >
            {t.cashier.unpaid}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentTab,
            activeTab === 'COMPLETED' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
          ]}
          onPress={() => setActiveTab('COMPLETED')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'COMPLETED' ? colors.text : colors.textSecondary },
              activeTab === 'COMPLETED' && styles.segmentTextActive,
            ]}
          >
            {t.cashier.completed}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentTab,
            activeTab === 'CANCELLED' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
          ]}
          onPress={() => setActiveTab('CANCELLED')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'CANCELLED' ? colors.text : colors.textSecondary },
              activeTab === 'CANCELLED' && styles.segmentTextActive,
            ]}
          >
            {t.cashier.cancelled}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Фільтр дат та виконавців */}
      <View style={styles.filterPillWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
            activeOpacity={0.75}
            onPress={handleDateFilterPress}
          >
            <MaterialCommunityIcons name="calendar-range" size={16} color={colors.textSecondary} />
            <Text style={[styles.filterPillText, { color: colors.text }]}>{dateRange}</Text>
            <MaterialCommunityIcons name="menu-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedExecutor !== 'ALL' ? '#10B98120' : colors.surface,
                borderColor: selectedExecutor !== 'ALL' ? '#10B981' : colors.cardBorder,
              },
            ]}
            activeOpacity={0.75}
            onPress={handleExecutorFilterPress}
          >
            <MaterialCommunityIcons
              name="account"
              size={16}
              color={selectedExecutor !== 'ALL' ? '#10B981' : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                { color: selectedExecutor !== 'ALL' ? '#10B981' : colors.text },
              ]}
            >
              {selectedExecutor === 'ALL'
                ? t.cashier.allExecutors
                : selectedExecutor === currentRawName
                ? `${t.cashier.myOrders} (${currentRawName})`
                : selectedExecutor}
            </Text>
            <MaterialCommunityIcons
              name="menu-down"
              size={18}
              color={selectedExecutor !== 'ALL' ? '#10B981' : colors.textSecondary}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 6. Пошук */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <TextInput
            placeholder={t.cashier.searchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          <MaterialCommunityIcons name="magnify" size={22} color={colors.textSecondary} />
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
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t.common.loading}
            </Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceLight }]}>
              <MaterialCommunityIcons name="cash-register" size={44} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.cashier.emptyOrders}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery.trim()
                ? (language === 'pl' ? 'Brak wyników dla podanego zapytania' : 'Нічого не відповідає вашому запиту')
                : t.cashier.emptySubtitle}
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

      {/* 8. Плаваюча кнопка "+ Створити чек" (FAB) */}
      <TouchableOpacity
        style={styles.fabButton}
        activeOpacity={0.85}
        onPress={handleCreateOrder}
      >
        <MaterialCommunityIcons name="receipt-text-plus" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>
          {language === 'pl' ? 'Nowy paragon' : 'Новий чек'}
        </Text>
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
