import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
import { ClientCard } from '../../components/ClientCard';
import { MOCK_CLIENTS, ClientItem } from '../../services/mockData';

/**
 * Екран 7: CRM-база клієнтів (ClientsCRMScreen)
 * Зона відповідальності: Розробник 2 (Артем Г)
 */
export default function ClientsCRMScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'VIP' | 'NEW' | 'INACTIVE'>('ALL');
  const [clientsList, setClientsList] = useState<ClientItem[]>(MOCK_CLIENTS);

  // Діалоги
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTag, setNewTag] = useState('');

  // Фільтрація клієнтів
  const filteredClients = useMemo(() => {
    return clientsList.filter((c) => {
      // Фільтр категорії
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) {
        return false;
      }
      // Пошук (ім'я, телефон або теги)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchTag = c.tags.some((t) => t.toLowerCase().includes(q));
        return matchName || matchPhone || matchTag;
      }
      return true;
    });
  }, [clientsList, categoryFilter, searchQuery]);

  // Загальний LTV бази
  const totalLTV = useMemo(() => {
    return clientsList.reduce((sum, c) => sum + c.totalSpent, 0);
  }, [clientsList]);

  const handleAddClient = () => {
    if (!newName.trim() || !newPhone.trim()) return;

    const newClient: ClientItem = {
      id: `c-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      category: 'NEW',
      tags: ['Новий клієнт', newTag.trim() || 'Послуги'],
      visitCount: 1,
      averageCheck: 600,
      totalSpent: 600,
      lastVisitDate: '10 жовт 2026',
      avatarColor: '#10B981',
    };

    setClientsList([newClient, ...clientsList]);
    setIsAddClientOpen(false);
    setNewName('');
    setNewPhone('');
    setNewTag('');
  };

  return (
    <View style={styles.container}>
      {/* 1. Верхня шапка */}
      <View style={styles.header}>
        <Text style={styles.title}>База клієнтів</Text>
        <Text style={styles.subtitle}>CRM картотека постійних відвідувачів салону</Text>
      </View>

      {/* 2. Пошук */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Пошук за ім'ям, телефоном або тегами..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#8E8E93"
          placeholderTextColor="#636366"
        />
      </View>

      {/* 3. Таби категорій */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={categoryFilter}
          onValueChange={(val) => setCategoryFilter(val as any)}
          buttons={[
            { value: 'ALL', label: 'Всі' },
            { value: 'VIP', label: '★ VIP' },
            { value: 'NEW', label: 'Нові' },
            { value: 'INACTIVE', label: 'Неактивні' },
          ]}
          style={styles.segmentedButtons}
          density="small"
        />
      </View>

      {/* 4. Метрики бази (лічильник + LTV) */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Клієнтів:</Text>
          <Text style={styles.summaryValue}>
            {filteredClients.length} з {clientsList.length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Сумарний LTV:</Text>
          <Text style={styles.ltvHighlight}>{totalLTV.toLocaleString('uk-UA')} ₴</Text>
        </View>
      </View>

      {/* 5. Список клієнтів */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredClients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onPress={() => setSelectedClient(client)}
          />
        ))}
      </ScrollView>

      {/* 6. FAB для додавання нового клієнта */}
      <FAB
        icon="account-plus"
        label="Новий клієнт"
        style={styles.fab}
        color="#000000"
        onPress={() => setIsAddClientOpen(true)}
      />

      {/* Діалог деталей клієнта */}
      <Portal>
        <Dialog
          visible={!!selectedClient}
          onDismiss={() => setSelectedClient(null)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>{selectedClient?.name}</Dialog.Title>
          <Dialog.Content>
            {selectedClient && (
              <View style={styles.dialogBody}>
                <Text style={styles.dialogLine}>
                  📞 <Text style={styles.dialogBold}>Телефон:</Text> {selectedClient.phone}
                </Text>
                <Text style={styles.dialogLine}>
                  🕒 <Text style={styles.dialogBold}>Останній візит:</Text> {selectedClient.lastVisitDate}
                </Text>
                <Text style={styles.dialogLine}>
                  🏷 <Text style={styles.dialogBold}>Теги:</Text> {selectedClient.tags.join(', ')}
                </Text>
                <View style={styles.dialogMetricsBox}>
                  <Text style={styles.metricText}>Візитів: {selectedClient.visitCount}</Text>
                  <Text style={styles.metricText}>Сер. чек: {selectedClient.averageCheck} ₴</Text>
                  <Text style={[styles.metricText, { color: '#34D399', fontWeight: '700' }]}>
                    Всього: {selectedClient.totalSpent} ₴
                  </Text>
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#C68A2C" onPress={() => setSelectedClient(null)}>
              Закрити
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Діалог додавання клієнта */}
      <Portal>
        <Dialog
          visible={isAddClientOpen}
          onDismiss={() => setIsAddClientOpen(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Додати нового клієнта</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Ім'я та прізвище"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={styles.dialogInput}
              textColor="#FFFFFF"
            />
            <TextInput
              label="Номер телефону"
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.dialogInput}
              textColor="#FFFFFF"
            />
            <TextInput
              label="Тег / уподобання"
              value={newTag}
              onChangeText={setNewTag}
              placeholder="напр. Любить френч"
              mode="outlined"
              style={styles.dialogInput}
              textColor="#FFFFFF"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#8E8E93" onPress={() => setIsAddClientOpen(false)}>
              Скасувати
            </Button>
            <Button textColor="#C68A2C" onPress={handleAddClient}>
              Додати в CRM
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
  ltvHighlight: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 90,
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
    gap: 8,
  },
  dialogLine: {
    color: '#E5E5EA',
    fontSize: 13.5,
  },
  dialogBold: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dialogMetricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  metricText: {
    fontSize: 12,
    color: '#E5E5EA',
  },
  dialogInput: {
    backgroundColor: '#121212',
    marginBottom: 10,
  },
});
