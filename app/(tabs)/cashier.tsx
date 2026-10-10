import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Text,
  Searchbar,
  SegmentedButtons,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OrderCard } from '../../components/OrderCard';
import { MOCK_ORDERS, OrderItem } from '../../services/mockData';
import { Colors } from '../../constants/colors';

/**
 * Екран 4: Каса та замовлення (CashierScreen)
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function CashierScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [ordersList, setOrdersList] = useState<OrderItem[]>(MOCK_ORDERS);

  // Діалог деталей чека
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // Діалог створення швидкого чека (через FAB)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Фільтрація замовлень за пошуком і табами статусів
  const filteredOrders = useMemo(() => {
    return ordersList.filter((ord) => {
      // Фільтр статусу
      if (statusFilter !== 'ALL' && ord.status !== statusFilter) {
        return false;
      }
      // Фільтр пошуку (номер чека або клієнт)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = ord.orderNumber.toLowerCase().includes(q);
        const matchClient = ord.clientName.toLowerCase().includes(q);
        return matchNumber || matchClient;
      }
      return true;
    });
  }, [ordersList, statusFilter, searchQuery]);

  // Підрахунок виручки за видимими чеками
  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [filteredOrders]);

  // Створення нового чека
  const handleCreateOrder = () => {
    if (!newClientName || !newAmount) return;

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      orderNumber: `№${Math.floor(8140 + Math.random() * 50)}`,
      status: 'COMPLETED',
      date: '10 жовт 2026, щойно',
      clientName: newClientName,
      clientPhone: '+380670000000',
      cashierName: 'Анастасія (Адмін)',
      itemsCount: 1,
      services: [newServiceName || 'Послуга салону'],
      totalAmount: parseFloat(newAmount) || 500,
      paymentMethod: 'CARD',
    };

    setOrdersList([newOrder, ...ordersList]);
    setIsCreateDialogOpen(false);
    setNewClientName('');
    setNewServiceName('');
    setNewAmount('');
  };

  return (
    <View style={styles.container}>
      {/* 1. Верхня шапка */}
      <View style={styles.header}>
        <Text style={styles.title}>Каса та замовлення</Text>
        <Text style={styles.subtitle}>Реєстр оплат, чеків та транзакцій салону</Text>
      </View>

      {/* 2. Пошук за чеком або клієнтом */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Пошук за № чека або клієнтом..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#8E8E93"
          placeholderTextColor="#636366"
        />
      </View>

      {/* 3. Таби статусів */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as any)}
          buttons={[
            { value: 'ALL', label: 'Всі' },
            { value: 'COMPLETED', label: 'Завершено' },
            { value: 'UNPAID', label: 'Не сплачено' },
            { value: 'CANCELLED', label: 'Скасовано' },
          ]}
          style={styles.segmentedButtons}
          density="small"
        />
      </View>

      {/* 4. Плашка виручки */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Замовлень:</Text>
          <Text style={styles.summaryValue}>{filteredOrders.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Оплачено:</Text>
          <Text style={styles.revenueHighlight}>{totalRevenue.toFixed(2)} ₴</Text>
        </View>
      </View>

      {/* 5. Список замовлень */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-search-outline" size={48} color="#636366" />
            <Text style={styles.emptyText}>Немає замовлень за заданими фільтрами</Text>
          </View>
        ) : (
          filteredOrders.map((item) => (
            <OrderCard
              key={item.id}
              order={item}
              onPress={() => setSelectedOrder(item)}
            />
          ))
        )}
      </ScrollView>

      {/* 6. Кнопка швидкого створення чека (FAB) */}
      <FAB
        icon="plus"
        label="Новий чек"
        style={styles.fab}
        color="#000000"
        onPress={() => setIsCreateDialogOpen(true)}
      />

      {/* Діалог перегляду деталей чека */}
      <Portal>
        <Dialog
          visible={!!selectedOrder}
          onDismiss={() => setSelectedOrder(null)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Деталі чека {selectedOrder?.orderNumber}
          </Dialog.Title>
          <Dialog.Content>
            {selectedOrder && (
              <View style={styles.dialogBody}>
                <Text style={styles.dialogLine}>
                  👤 <Text style={styles.dialogBold}>Клієнт:</Text> {selectedOrder.clientName}
                </Text>
                <Text style={styles.dialogLine}>
                  📞 <Text style={styles.dialogBold}>Телефон:</Text> {selectedOrder.clientPhone}
                </Text>
                <Text style={styles.dialogLine}>
                  ✂ <Text style={styles.dialogBold}>Послуги:</Text> {selectedOrder.services.join(', ')}
                </Text>
                <Text style={styles.dialogLine}>
                  🕒 <Text style={styles.dialogBold}>Дата:</Text> {selectedOrder.date}
                </Text>
                <Text style={styles.dialogLine}>
                  💳 <Text style={styles.dialogBold}>Оплата:</Text>{' '}
                  {selectedOrder.paymentMethod === 'CARD' ? 'Банківська картка' : 'Готівка'}
                </Text>
                <Text style={[styles.dialogLine, styles.amountLine]}>
                  Сума: {selectedOrder.totalAmount.toFixed(2)} ₴
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#C68A2C" onPress={() => setSelectedOrder(null)}>
              Закрити
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Діалог створення нового чека */}
      <Portal>
        <Dialog
          visible={isCreateDialogOpen}
          onDismiss={() => setIsCreateDialogOpen(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Створення нового чека</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Ім'я клієнта"
              value={newClientName}
              onChangeText={setNewClientName}
              mode="outlined"
              style={styles.dialogInput}
              textColor="#FFFFFF"
            />
            <TextInput
              label="Назва послуги"
              value={newServiceName}
              onChangeText={setNewServiceName}
              mode="outlined"
              style={styles.dialogInput}
              textColor="#FFFFFF"
            />
            <TextInput
              label="Сума (₴)"
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.dialogInput}
              textColor="#FFFFFF"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#8E8E93" onPress={() => setIsCreateDialogOpen(false)}>
              Скасувати
            </Button>
            <Button textColor="#C68A2C" onPress={handleCreateOrder}>
              Зберегти чек
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 45,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchbar: {
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242426',
    height: 44,
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: '#121212',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#161616',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#242426',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  revenueHighlight: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#8E8E93',
    marginTop: 12,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  dialog: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  dialogBody: {
    gap: 6,
  },
  dialogLine: {
    color: '#E5E5EA',
    fontSize: 13.5,
  },
  dialogBold: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  amountLine: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
  },
  dialogInput: {
    backgroundColor: '#121212',
    marginBottom: 10,
  },
});
