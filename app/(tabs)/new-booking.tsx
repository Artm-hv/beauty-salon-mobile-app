import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Text, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MOCK_CLIENTS, ClientItem } from '../../services/mockData';

// Каталог послуг салону "Svoya Nail Studio"
const AVAILABLE_SERVICES = [
  { id: 's-1', name: 'Комплексний манікюр + покриття', price: 700, duration: '1 год 30 хв' },
  { id: 's-2', name: 'Нарощування нігтів (гелеве)', price: 1100, duration: '2 год 00 хв' },
  { id: 's-3', name: 'Апаратний педикюр', price: 850, duration: '1 год 30 хв' },
  { id: 's-4', name: 'Зняття + гігієнічний манікюр', price: 450, duration: '1 год 00 хв' },
  { id: 's-5', name: 'Дизайн нігтів (складний розпис)', price: 250, duration: '30 хв' },
];

const ORDER_SOURCES = ['По телефону', 'Instagram', 'Онлайн-запис', 'Viber', 'На місці'];

const COLOR_SWATCHES = [
  '#8E9AA8', // Slate
  '#FF7043', // Orange
  '#FFA000', // Amber
  '#FF0000', // Red
  '#E91E63', // Pink
  '#7C4DFF', // Purple
  '#00E676', // Bright green
  '#AEEA00', // Lime
  '#2979FF', // Blue
  '#00B0FF', // Cyan
  '#2E7D32', // Dark green
  '#BF360C', // Cinnamon brown
];

/**
 * Екран 5: Нове бронювання за точним скріншотом EasyWeek
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function NewBookingScreen() {
  const router = useRouter();

  // Стан форми
  const [selectedServices, setSelectedServices] = useState<typeof AVAILABLE_SERVICES>([]);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [comment, setComment] = useState('');
  const [orderSource, setOrderSource] = useState('По телефону');
  const [selectedColor, setSelectedColor] = useState<string | null>(null); // null = Авто

  // Модальні вікна
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Новий клієнт
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Підрахунок суми
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const formatMoney = (val: number) => {
    const parts = val.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${integerPart},${parts[1]} ₴`;
  };

  const handleToggleService = (service: (typeof AVAILABLE_SERVICES)[0]) => {
    if (selectedServices.some((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleCreateNewClient = () => {
    if (!newClientName.trim()) {
      Alert.alert('Помилка', "Введіть ім'я клієнта");
      return;
    }
    const newClient: ClientItem = {
      id: `c-${Date.now()}`,
      cnCode: `CN-${Math.floor(2000 + Math.random() * 900)}`,
      name: newClientName.trim(),
      phone: newClientPhone.trim() || '+380 67 000 0000',
      category: 'NEW',
      tags: ['Новий клієнт'],
      visitCount: 0,
      averageCheck: 0,
      totalSpent: 0,
      lastVisitDate: '10 жовт 2026',
      avatarColor: '#10B981',
    };
    setSelectedClient(newClient);
    setIsCreateClientOpen(false);
    setNewClientName('');
    setNewClientPhone('');
  };

  const handleSave = () => {
    setSnackbarVisible(true);
    setTimeout(() => {
      router.push('/(tabs)/calendar');
    }, 1200);
  };

  const handlePayment = () => {
    Alert.alert(
      'Перехід до оплати',
      `Сума за бронювання: ${formatMoney(totalPrice)}\nКлієнт: ${selectedClient ? selectedClient.name : 'Анонімний'}`,
      [
        { text: 'Створити чек на касі', onPress: () => router.push('/(tabs)/cashier') },
        { text: 'Скасувати', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Верхня панель: стрілка назад та кнопка "Повторювати" */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/calendar')}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.repeatButton}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Повторення', 'Налаштування повторюваного бронювання (щотижня, щомісяця)')}
          >
            <MaterialCommunityIcons name="repeat" size={18} color="#8E8E93" />
            <Text style={styles.repeatText}>Повторювати</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Заголовок "Нове бронювання" */}
        <Text style={styles.pageTitle}>Нове бронювання</Text>

        {/* 3. Картка дати та часу з плаваючим значком календаря */}
        <View style={styles.dateTimeCardWrapper}>
          <View style={styles.floatingBadge}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#FFFFFF" />
          </View>

          <TouchableOpacity
            style={styles.dateTimeContent}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Час бронювання', 'Сб, 10 жовт 2026 р. 20:35')}
          >
            <View style={styles.dateTimeRow}>
              <Text style={styles.dateTimeText}>Сб, 10 жовт 2026 р. 20:35</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
            </View>

            <View style={styles.newRecordPill}>
              <Text style={styles.newRecordText}>+ Новий запис</Text>
              <MaterialCommunityIcons name="menu-down" size={16} color="#38BDF8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Картка "Послуги" */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Послуги</Text>

          {/* Вибрані послуги, якщо є */}
          {selectedServices.map((service) => (
            <View key={service.id} style={styles.selectedServiceItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedServiceName}>{service.name}</Text>
                <Text style={styles.selectedServiceMeta}>
                  {service.duration} • {service.price} ₴
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleToggleService(service)}
                style={styles.removeServiceBtn}
              >
                <MaterialCommunityIcons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Пунктирна кнопка "+ Додати послугу" */}
          <TouchableOpacity
            style={styles.dashedAddBox}
            activeOpacity={0.7}
            onPress={() => setIsServiceModalOpen(true)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.dashedAddText}>Додати послугу</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Картка "Клієнт" */}
        <View style={styles.card}>
          <View style={styles.clientHeaderRow}>
            <Text style={styles.cardTitle}>Клієнт</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCreateClientOpen(true)}
            >
              <Text style={styles.createClientBtnText}>СТВОРИТИ НОВОГО</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.clientSelectorBox}
            activeOpacity={0.75}
            onPress={() => setIsClientModalOpen(true)}
          >
            <View style={styles.clientSelectorLeft}>
              <View style={styles.incognitoCircle}>
                <MaterialCommunityIcons
                  name={selectedClient ? 'account' : 'incognito'}
                  size={18}
                  color="#8E8E93"
                />
              </View>
              <Text style={styles.clientSelectorText}>
                {selectedClient
                  ? `${selectedClient.name} (${selectedClient.cnCode || 'Клієнт'})`
                  : 'Не обрано (Анонімний)'}
              </Text>
            </View>
            <MaterialCommunityIcons name="menu-down" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* 6. Картка "Примітки" */}
        <View style={styles.card}>
          <TextInput
            placeholder="Примітка тільки для внутрішнього використання"
            placeholderTextColor="#8E8E93"
            value={internalNotes}
            onChangeText={setInternalNotes}
            style={styles.noteInput}
            multiline
          />
        </View>

        {/* 7. Картка "Підсумок" */}
        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Підсумок</Text>

          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryLabel}>Проміжний підсумок</Text>
            <Text style={styles.summaryLabel}>Усього за бронювання</Text>
          </View>

          <Text style={styles.summaryAmount}>{formatMoney(totalPrice)}</Text>
        </View>

        {/* 8. Секція "Коментар", "Джерело замовлення", "Створено" та палітра кольорів */}
        <View style={styles.card}>
          {/* Коментар */}
          <TextInput
            placeholder="Коментар"
            placeholderTextColor="#636366"
            value={comment}
            onChangeText={setComment}
            style={styles.commentInput}
            multiline
            numberOfLines={3}
          />

          <View style={styles.cardDivider} />

          {/* Джерело замовлення */}
          <TouchableOpacity
            style={styles.sourceBox}
            activeOpacity={0.75}
            onPress={() => setIsSourceModalOpen(true)}
          >
            <View>
              <Text style={styles.sourceLabel}>Джерело замовлення</Text>
              <Text style={styles.sourceValue}>{orderSource}</Text>
            </View>
            <MaterialCommunityIcons name="menu-down" size={20} color="#8E8E93" />
          </TouchableOpacity>

          {/* Створено */}
          <View style={styles.createdBox}>
            <Text style={styles.createdLabel}>Створено</Text>
            <Text style={styles.createdValue}>Клієнт</Text>
          </View>

          {/* Кольорові крапки */}
          <View style={styles.colorPaletteRow}>
            <TouchableOpacity
              style={[
                styles.autoPill,
                selectedColor === null && styles.autoPillSelected,
              ]}
              onPress={() => setSelectedColor(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.autoPillText}>Авто</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchesScroll}>
              {COLOR_SWATCHES.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                      isSelected && styles.colorDotSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    activeOpacity={0.8}
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* 9. Фіксована нижня панель: "Зберегти" та "Оплата >" */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Зберегти</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paymentButton}
          activeOpacity={0.85}
          onPress={handlePayment}
        >
          <Text style={styles.paymentButtonText}>Оплата</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Модальне вікно вибору послуг */}
      <Modal visible={isServiceModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оберіть послугу</Text>
              <TouchableOpacity onPress={() => setIsServiceModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {AVAILABLE_SERVICES.map((s) => {
                const isChecked = selectedServices.some((item) => item.id === s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceModalItem}
                    onPress={() => handleToggleService(s)}
                  >
                    <MaterialCommunityIcons
                      name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={isChecked ? '#4CAF50' : '#8E8E93'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceModalName}>{s.name}</Text>
                      <Text style={styles.serviceModalMeta}>{s.duration}</Text>
                    </View>
                    <Text style={styles.serviceModalPrice}>{s.price} ₴</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setIsServiceModalOpen(false)}
            >
              <Text style={styles.modalDoneBtnText}>Готово</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору клієнта */}
      <Modal visible={isClientModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Оберіть клієнта</Text>
              <TouchableOpacity onPress={() => setIsClientModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              <TouchableOpacity
                style={styles.clientModalItem}
                onPress={() => {
                  setSelectedClient(null);
                  setIsClientModalOpen(false);
                }}
              >
                <MaterialCommunityIcons name="incognito" size={22} color="#8E8E93" />
                <Text style={styles.clientModalName}>Не обрано (Анонімний)</Text>
              </TouchableOpacity>

              {MOCK_CLIENTS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.clientModalItem}
                  onPress={() => {
                    setSelectedClient(c);
                    setIsClientModalOpen(false);
                  }}
                >
                  <View style={[styles.modalClientAvatar, { backgroundColor: c.avatarColor }]}>
                    <Text style={styles.modalClientLetter}>{c.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientModalName}>{c.name}</Text>
                    <Text style={styles.clientModalPhone}>{c.cnCode} • {c.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно створення клієнта */}
      <Modal visible={isCreateClientOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Створити нового клієнта</Text>
              <TouchableOpacity onPress={() => setIsCreateClientOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Ім'я та прізвище"
              placeholderTextColor="#8E8E93"
              value={newClientName}
              onChangeText={setNewClientName}
              style={styles.modalInput}
            />

            <TextInput
              placeholder="Номер телефону (+380...)"
              placeholderTextColor="#8E8E93"
              value={newClientPhone}
              onChangeText={setNewClientPhone}
              keyboardType="phone-pad"
              style={styles.modalInput}
            />

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={handleCreateNewClient}
            >
              <Text style={styles.modalDoneBtnText}>Зберегти клієнта</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальне вікно вибору джерела */}
      <Modal visible={isSourceModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Джерело замовлення</Text>
              <TouchableOpacity onPress={() => setIsSourceModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {ORDER_SOURCES.map((src) => (
              <TouchableOpacity
                key={src}
                style={styles.sourceOptionItem}
                onPress={() => {
                  setOrderSource(src);
                  setIsSourceModalOpen(false);
                }}
              >
                <Text style={[styles.sourceOptionText, orderSource === src && { color: '#4CAF50', fontWeight: '700' }]}>
                  {src}
                </Text>
                {orderSource === src && (
                  <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={1500}
        style={{ backgroundColor: '#133E1D' }}
      >
        <Text style={{ color: '#34D399', fontWeight: 'bold' }}>
          ✓ Запис успішно збережено в розклад!
        </Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  repeatText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 16,
  },
  dateTimeCardWrapper: {
    backgroundColor: '#1C1C20',
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  floatingBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#28282D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -26,
    marginBottom: 8,
  },
  dateTimeContent: {
    alignItems: 'center',
    width: '100%',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dateTimeText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  newRecordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E3846',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  newRecordText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1C1C20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  selectedServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  selectedServiceName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedServiceMeta: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  removeServiceBtn: {
    padding: 6,
  },
  dashedAddBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#48484A',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dashedAddText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '500',
  },
  clientHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  createClientBtnText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clientSelectorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  clientSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  incognitoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#25252A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientSelectorText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  noteInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 44,
    paddingVertical: 0,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 13,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  commentInput: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    minHeight: 90,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#28282D',
    marginVertical: 14,
  },
  sourceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sourceLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  sourceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  createdBox: {
    marginTop: 14,
  },
  createdLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  createdValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  autoPill: {
    backgroundColor: '#28282D',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  autoPillSelected: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  autoPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  swatchesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 52,
    gap: 6,
  },
  paymentButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C20',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  serviceModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#28282D',
    gap: 12,
  },
  serviceModalName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceModalMeta: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  serviceModalPrice: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  clientModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#28282D',
    gap: 12,
  },
  modalClientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClientLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  clientModalName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clientModalPhone: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalDoneBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sourceOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#28282D',
  },
  sourceOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
