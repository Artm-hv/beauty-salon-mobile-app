import { useAlert } from '../../context/AlertContext';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
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

const MONTHS_PL = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
];

const MONTHS_UA = [
  'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
  'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень',
];

const WEEKDAYS_SHORT_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
const WEEKDAYS_SHORT_UA = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

/**
 * Екран: Замовлення (Каса)
 * Зона відповідальності: Розробник 2 (Артем Гіжовський)
 * Підключено збереження та зміну статусів замовлень (GET, POST, PUT)
 */
export default function CashierScreen() {
  const showAlert = useAlert();
  const router = useRouter();
  const { colors, t, language, isDark } = useAppSettings();
  const currentUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState<OrderStatusTab>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL'); // 'ALL' або 'YYYY-MM-DD'
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());

  const [searchQuery, setSearchQuery] = useState('');
  const [ordersList, setOrdersList] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const toIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatPillDate = (dateStr: string) => {
    if (dateStr === 'ALL') {
      return language === 'pl' ? 'Wszystkie daty' : 'Всі дати';
    }
    const [y, m, d] = dateStr.split('-');
    const mIndex = parseInt(m, 10) - 1;
    const mName = language === 'pl' ? MONTHS_PL[mIndex] : MONTHS_UA[mIndex];
    const shortMonth = mName ? mName.slice(0, 3) : '';
    return language === 'pl'
      ? `${parseInt(d, 10)} ${shortMonth} ${y}`
      : `${parseInt(d, 10)} ${shortMonth} ${y} р.`;
  };

  const pickerMonthLabel = useMemo(() => {
    const list = language === 'pl' ? MONTHS_PL : MONTHS_UA;
    const name = list[pickerMonth] || '';
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${pickerYear}`;
  }, [language, pickerMonth, pickerYear]);

  const handlePrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  };

  const monthCalendarDays = useMemo(() => {
    const firstDay = new Date(pickerYear, pickerMonth, 1);
    const lastDay = new Date(pickerYear, pickerMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(pickerYear, pickerMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(pickerYear, pickerMonth - 1, d);
      days.push({ day: d, dateStr: toIsoDate(prevDate), isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(pickerYear, pickerMonth, d);
      days.push({ day: d, dateStr: toIsoDate(currDate), isCurrentMonth: true });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(pickerYear, pickerMonth + 1, d);
      days.push({ day: d, dateStr: toIsoDate(nextDate), isCurrentMonth: false });
    }

    return days;
  }, [pickerYear, pickerMonth]);

  const getOrdersCountForDate = (dateStr: string) => {
    return ordersList.filter((ord) => ord.date && ord.date.startsWith(dateStr)).length;
  };

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

      // Фільтр за обраною датою
      if (selectedDate !== 'ALL') {
        if (!ord.date || !ord.date.startsWith(selectedDate)) {
          return false;
        }
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
  }, [ordersList, activeTab, selectedDate, searchQuery]);

  // Дії із замовленням (перевірка PUT методу)
  const changeStatus = async (id: string, status: OrderItem['status']) => {
    try {
      await apiClient.updateOrderStatus(id, status);
      await fetchOrders();
    } catch (error) {
      showAlert(language === 'pl' ? 'Błąd' : 'Помилка', error instanceof Error ? error.message : String(error));
    }
  };
  const handleOrderPress = (order: OrderItem) => {
    const cleanCashier = (order.cashierName || 'Artem Hizhovskyi')
      .replace(/\s*\([^)]*\)/g, '')
      .replace('Артем Гіжовський', 'Artem Hizhovskyi')
      .replace('Ігор Намачинський', 'Ihor Namachynskyi')
      .replace('Артем Лабунський', 'Artem Labynskyi')
      .trim();

    showAlert(
      `${t.cashier.order} ${order.orderNumber}`,
      `${language === 'pl' ? 'Status' : 'Статус'}: ${order.status === 'COMPLETED' ? t.cashier.completed : order.status === 'UNPAID' ? t.cashier.unpaid : t.cashier.cancelled}\n${t.booking.client}: ${order.clientName}\n${t.cashier.cashier}: ${cleanCashier}\n${t.cashier.total}: ${order.totalAmount} ₴\n${t.booking.services}:\n• ${order.services.join('\n• ')}`,
      [
        {
          text: t.cashier.markPaid,
          onPress: () => changeStatus(order.id, 'COMPLETED'),
        },
        {
          text: t.cashier.cancelReceipt,
          style: 'destructive',
          onPress: () => changeStatus(order.id, 'CANCELLED'),
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
            activeTab === 'ALL' && [
              styles.segmentTabActive,
              {
                backgroundColor: colors.surface,
                borderWidth: isDark ? 0 : 1,
                borderColor: colors.cardBorder,
              },
            ],
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
            activeTab === 'UNPAID' && [
              styles.segmentTabActive,
              {
                backgroundColor: colors.surface,
                borderWidth: isDark ? 0 : 1,
                borderColor: colors.cardBorder,
              },
            ],
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
            activeTab === 'COMPLETED' && [
              styles.segmentTabActive,
              {
                backgroundColor: colors.surface,
                borderWidth: isDark ? 0 : 1,
                borderColor: colors.cardBorder,
              },
            ],
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
            activeTab === 'CANCELLED' && [
              styles.segmentTabActive,
              {
                backgroundColor: colors.surface,
                borderWidth: isDark ? 0 : 1,
                borderColor: colors.cardBorder,
              },
            ],
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

      {/* 4. Фільтр дат (Інтерактивний календар) */}
      <View style={styles.filterPillWrapper}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            {
              backgroundColor: selectedDate !== 'ALL' ? '#10B98120' : colors.surface,
              borderColor: selectedDate !== 'ALL' ? '#10B981' : colors.cardBorder,
            },
          ]}
          activeOpacity={0.75}
          onPress={() => setIsDatePickerOpen(true)}
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={18}
            color={selectedDate !== 'ALL' ? '#10B981' : colors.textSecondary}
          />
          <Text
            style={[
              styles.filterPillText,
              { color: selectedDate !== 'ALL' ? '#10B981' : colors.text },
            ]}
          >
            {formatPillDate(selectedDate)} ({filteredOrders.length})
          </Text>
          <MaterialCommunityIcons
            name="menu-down"
            size={18}
            color={selectedDate !== 'ALL' ? '#10B981' : colors.textSecondary}
          />
        </TouchableOpacity>
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

      {/* Модальне вікно вибору дати (Інтерактивний календар) */}
      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerOpen(false)}
        >
          <View
            style={[
              styles.datePickerModal,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            {/* Шапка календаря: перемикач місяців */}
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={[styles.calArrowBtn, { backgroundColor: colors.surfaceLight }]}
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calMonthTitle, { color: colors.text }]}>
                {pickerMonthLabel}
              </Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={[styles.calArrowBtn, { backgroundColor: colors.surfaceLight }]}
              >
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Дні тижня (Пн-Нд) */}
            <View style={styles.calWeekdaysRow}>
              {(language === 'pl' ? WEEKDAYS_SHORT_PL : WEEKDAYS_SHORT_UA).map((wd, i) => (
                <Text key={i} style={[styles.calWeekdayText, { color: colors.textSecondary }]}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Сітка днів місяця */}
            <View style={styles.calDaysGrid}>
              {monthCalendarDays.map((item, index) => {
                const isSelected = selectedDate === item.dateStr;
                const count = getOrdersCountForDate(item.dateStr);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calDayCell,
                      isSelected && styles.calDayCellSelected,
                    ]}
                    onPress={() => {
                      setSelectedDate(item.dateStr);
                      setIsDatePickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.calDayNum,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : item.isCurrentMonth
                            ? colors.text
                            : colors.textSecondary + '66',
                        },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {item.day}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          styles.calDotBadge,
                          isSelected && { backgroundColor: '#FFFFFF' },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Кнопка "Всі дати" */}
            <View style={styles.calBottomActions}>
              <TouchableOpacity
                style={[
                  styles.allDatesBtn,
                  selectedDate === 'ALL' && styles.allDatesBtnActive,
                ]}
                onPress={() => {
                  setSelectedDate('ALL');
                  setIsDatePickerOpen(false);
                }}
              >
                <MaterialCommunityIcons
                  name="calendar-multiselect"
                  size={18}
                  color={selectedDate === 'ALL' ? '#FFFFFF' : '#10B981'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.allDatesText,
                    selectedDate === 'ALL' && { color: '#FFFFFF' },
                  ]}
                >
                  {language === 'pl' ? 'Wszystkie daty (cała lista)' : 'Всі дати (повний список)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calWeekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calDayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
    position: 'relative',
  },
  calDayCellSelected: {
    backgroundColor: '#10B981',
  },
  calDayNum: {
    fontSize: 14,
    fontWeight: '500',
  },
  calDotBadge: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  calBottomActions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#28282C',
    paddingTop: 12,
  },
  allDatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98118',
    borderWidth: 1,
    borderColor: '#10B98166',
    borderRadius: 12,
    paddingVertical: 10,
  },
  allDatesBtnActive: {
    backgroundColor: '#10B981',
  },
  allDatesText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
});
