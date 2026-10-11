import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ClientCard } from '../../components/ClientCard';
import { ClientItem } from '../../services/mockData';
import { apiClient } from '../../services/api';

type SegmentTab = 'ALL' | 'NEW' | 'INACTIVE' | 'NO_RECORD';

/**
 * Екран: Клієнти (CRM картотека)
 * Зона відповідальності: Розробник 2 (Артем Гіжовський)
 * Реалізовано:
 * - REST API: GET /api/clients, POST /api/clients
 * - Синхронізація з сервером бази даних
 * - Додавання клієнтів у модальному вікні
 * - Pull-to-Refresh (оновлення свайпом вниз)
 */
export default function ClientsCRMScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SegmentTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientsList, setClientsList] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Модальне вікно створення клієнта
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState<'NEW' | 'VIP' | 'ALL' | 'INACTIVE'>('NEW');
  const [submitting, setSubmitting] = useState(false);

  // Завантаження клієнтів з REST API (GET)
  const loadClients = useCallback(async () => {
    try {
      const data = await apiClient.getClients();
      setClientsList(data);
    } catch {
      // Помилка обробляється всередині apiClient
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadClients();
  }, [loadClients]);

  // Створення нового клієнта через REST API (POST)
  const handleSaveClient = async () => {
    if (!newName.trim()) {
      Alert.alert('Помилка', "Будь ласка, вкажіть ім'я або прізвище клієнта");
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiClient.createClient({
        name: newName.trim(),
        phone: newPhone.trim() || '+380 67 000 0000',
        category: newCategory,
        tags: newCategory === 'VIP' ? ['VIP', 'Постійний'] : ['Новий клієнт'],
      });

      setClientsList((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewCategory('NEW');
      Alert.alert('Успіх', `Клієнта "${created.name}" успішно додано до бази!`);
    } catch {
      Alert.alert('Помилка', 'Не вдалося зберегти клієнта на сервері');
    } finally {
      setSubmitting(false);
    }
  };

  // Фільтрація клієнтів
  const filteredClients = useMemo(() => {
    return clientsList.filter((c) => {
      if (activeTab === 'NEW' && c.category !== 'NEW') return false;
      if (activeTab === 'INACTIVE' && c.category !== 'INACTIVE') return false;
      if (activeTab === 'NO_RECORD' && c.visitCount > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchCode = c.cnCode?.toLowerCase().includes(q);
        return matchName || matchPhone || matchCode;
      }
      return true;
    });
  }, [clientsList, activeTab, searchQuery]);

  const handleCardPress = (client: ClientItem) => {
    Alert.alert(
      client.name,
      `Код: ${client.cnCode}\nТелефон: ${client.phone}\nКатегорія: ${client.category}\nВізитів: ${client.visitCount}\nОплачено: ${client.totalSpent} ₴`,
      [
        {
          text: 'Новий запис',
          onPress: () =>
            router.push({
              pathname: '/(tabs)/new-booking',
              params: { clientId: client.id },
            }),
        },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const handleQuickAdd = (client: ClientItem) => {
    router.push({
      pathname: '/(tabs)/new-booking',
      params: { clientId: client.id },
    });
  };

  const handleImportDatabase = async () => {
    try {
      const updated = await apiClient.importClientsDatabase();
      setClientsList(updated);
      Alert.alert(
        'Імпорт бази',
        `✓ Базу клієнтів успішно імпортовано! Завантажено ${updated.length} клієнтів салону.`
      );
    } catch {
      Alert.alert('Помилка', 'Не вдалося імпортувати базу клієнтів');
    }
  };

  const handleMenuPress = () => {
    Alert.alert('Управління базою', 'Оберіть потрібну дію:', [
      { text: 'Оновити дані з сервера', onPress: loadClients },
      { text: '📥 Імпорт бази', onPress: handleImportDatabase },
      {
        text: 'Очистити базу (Скинути)',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Підтвердження', 'Очистити всю тестову базу?', [
            {
              text: 'Так, очистити',
              style: 'destructive',
              onPress: async () => {
                await apiClient.clearAllData();
                loadClients();
              },
            },
            { text: 'Скасувати', style: 'cancel' },
          ]);
        },
      },
      { text: 'Закрити', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 1. Верхня панель дій з меню */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.7}
          onPress={handleMenuPress}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Заголовок "Клієнти" */}
      <Text style={styles.screenTitle}>Клієнти</Text>

      {/* 3. Сегментований перемикач */}
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
          style={[styles.segmentTab, activeTab === 'NEW' && styles.segmentTabActive]}
          onPress={() => setActiveTab('NEW')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'NEW' && styles.segmentTextActive]}>
            Нові
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'INACTIVE' && styles.segmentTabActive]}
          onPress={() => setActiveTab('INACTIVE')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'INACTIVE' && styles.segmentTextActive]}>
            Неактивні
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'NO_RECORD' && styles.segmentTabActive]}
          onPress={() => setActiveTab('NO_RECORD')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeTab === 'NO_RECORD' && styles.segmentTextActive]}>
            Без запису
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Пошук клієнтів (на всю ширину) */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Пошук клієнта за ім'ям або телефоном"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <MaterialCommunityIcons name="magnify" size={22} color="#8E8E93" />
        </View>
      </View>

      {/* 5. Плашка лічильника клієнтів */}
      <View style={styles.counterCard}>
        <Text style={styles.counterMainText}>
          {filteredClients.length} клієнтів показано <Text style={styles.counterSubText}>з {clientsList.length}</Text>
        </Text>
      </View>

      {/* 6. Список клієнтів або стан порожнечі */}
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
            <Text style={styles.loadingText}>Завантаження бази клієнтів...</Text>
          </View>
        ) : filteredClients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#8E8E93" />
            </View>
            <Text style={styles.emptyTitle}>База клієнтів порожня</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'За вашим запитом нічого не знайдено'
                : 'Натисніть кнопку "+ Додати клієнта", щоб зареєструвати першого клієнта'}
            </Text>
            {!searchQuery.trim() && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                activeOpacity={0.85}
                onPress={() => setIsAddModalOpen(true)}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#000000" />
                <Text style={styles.emptyAddButtonText}>Додати першого клієнта</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onPress={() => handleCardPress(client)}
            />
          ))
        )}
      </ScrollView>

      {/* 7. Плаваюча кнопка "+ Додати клієнта" (FAB) */}
      <TouchableOpacity
        style={styles.fabButton}
        activeOpacity={0.85}
        onPress={() => setIsAddModalOpen(true)}
      >
        <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Додати клієнта</Text>
      </TouchableOpacity>

      {/* Модальне вікно додавання клієнта з підтримкою клавіатури */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdropDismiss} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Новий клієнт</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollBody}
            >
              <Text style={styles.inputLabel}>Ім'я та прізвище *</Text>
              <TextInput
                placeholder="наприклад, Анна Коваленко"
                placeholderTextColor="#8E8E93"
                value={newName}
                onChangeText={setNewName}
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Номер телефону</Text>
              <TextInput
                placeholder="+380 67 123 4567"
                placeholderTextColor="#8E8E93"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>Категорія клієнта</Text>
              <View style={styles.categoryPickerRow}>
                {(['NEW', 'VIP', 'INACTIVE'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      newCategory === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        newCategory === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat === 'NEW' ? 'Новий' : cat === 'VIP' ? 'VIP' : 'Неактивний'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSaveClient}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Зберегти в базу</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  addClientTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E6F38',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addClientTopBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  menuButton: {
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#28282C',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  counterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  counterMainText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  counterSubText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  multiSelectBtn: {
    backgroundColor: '#2B2B30',
    borderWidth: 1,
    borderColor: '#3A3A40',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  multiSelectBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  multiSelectText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollList: {
    paddingBottom: 85,
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
    marginBottom: 20,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyAddButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
  },
  modalScrollBody: {
    paddingBottom: 16,
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
  inputLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  categoryChip: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#4CAF50',
  },
  categoryChipText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalSubmitBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E6F38',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
