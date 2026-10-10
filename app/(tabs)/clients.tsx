import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ClientCard } from '../../components/ClientCard';
import { MOCK_CLIENTS, ClientItem } from '../../services/mockData';

type SegmentTab = 'ALL' | 'NEW' | 'INACTIVE' | 'NO_RECORD';

/**
 * Екран 7: Клієнти (CRM картотека) за скріншотом EasyWeek
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function ClientsCRMScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SegmentTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clientsList, setClientsList] = useState<ClientItem[]>(MOCK_CLIENTS);

  // Фільтрація клієнтів
  const filteredClients = useMemo(() => {
    return clientsList.filter((c) => {
      // Фільтр за табами
      if (activeTab === 'NEW' && c.category !== 'NEW') return false;
      if (activeTab === 'INACTIVE' && c.category !== 'INACTIVE') return false;
      if (activeTab === 'NO_RECORD' && c.visitCount > 0) return false;

      // Пошук за ім'ям або телефоном
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

  const toggleMultiSelect = () => {
    setIsMultiSelect(!isMultiSelect);
    setSelectedIds([]);
  };

  const handleCardPress = (client: ClientItem) => {
    if (isMultiSelect) {
      if (selectedIds.includes(client.id)) {
        setSelectedIds(selectedIds.filter((id) => id !== client.id));
      } else {
        setSelectedIds([...selectedIds, client.id]);
      }
    } else {
      Alert.alert(
        client.name,
        `Код: ${client.cnCode}\nТелефон: ${client.phone}\nВізитів: ${client.visitCount}\nОплачено: ${client.totalSpent} ₴`,
        [
          { text: 'Новий запис', onPress: () => router.push('/(tabs)/new-booking') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }
  };

  const handleQuickAdd = (client: ClientItem) => {
    router.push('/(tabs)/new-booking');
  };

  return (
    <View style={styles.container}>
      {/* 1. Верхня панель дій з кнопкою "..." */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Опції', 'Експорт бази клієнтів, імпорт контактів або налаштування полів')}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Заголовок "Клієнти" */}
      <Text style={styles.screenTitle}>Клієнти</Text>

      {/* 3. Сегментований перемикач (Всі, Нові, Неактивні, Без запису) */}
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

      {/* 4. Пошук та кнопка фільтрів */}
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

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Фільтри', 'Фільтр за тегами, майстрами та послугами')}
        >
          <MaterialCommunityIcons name="tune-variant" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 5. Плашка лічильника (15 клієнтів показано з 2502 + Множинний вибір) */}
      <View style={styles.counterCard}>
        <View>
          <Text style={styles.counterMainText}>15 клієнтів показано</Text>
          <Text style={styles.counterSubText}>з 2502</Text>
        </View>

        <TouchableOpacity
          style={[styles.multiSelectBtn, isMultiSelect && styles.multiSelectBtnActive]}
          onPress={toggleMultiSelect}
          activeOpacity={0.8}
        >
          <Text style={styles.multiSelectText}>
            {isMultiSelect ? `Обрано (${selectedIds.length})` : 'Множинний вибір'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. Список карток клієнтів */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
      >
        {filteredClients.map((client, idx) => (
          <ClientCard
            key={client.id}
            client={client}
            onPress={() => handleCardPress(client)}
            showAddButton={client.cnCode === 'CN-2100'}
            onAddPress={() => handleQuickAdd(client)}
          />
        ))}
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
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 6,
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#25252A',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});
