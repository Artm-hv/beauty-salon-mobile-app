import { useAlert } from '../context/AlertContext';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppSettings } from '../context/AppSettingsContext';
import { apiClient } from '../services/api';
import { authService } from '../services/authService';
import { User, UserRole } from '../constants/types';

/**
 * Екран: Персонал та надання ролей (Staff Management)
 * Зона відповідальності: Артем Лабунський (Розробник 3)
 */
export default function StaffScreen() {
  const showAlert = useAlert();
  const router = useRouter();
  const { colors, t, language } = useAppSettings();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.getUsers();
      if (Array.isArray(data)) {
        setUsersList(data);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        fetchUsers();
      }
    }, [isAdmin])
  );

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(tabs)/settings');
      return;
    }
    fetchUsers();

    // Автоматичне фонове оновлення кожні 3 секунди
    const interval = setInterval(async () => {
      try {
        const data = await apiClient.getUsers();
        if (Array.isArray(data)) {
          setUsersList(data);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Надання ролі новому користувачеві (реальний запит до сервера)
  const handleAssignRole = async (userId: string, newRole: UserRole) => {
    try {
      await apiClient.updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setMessage(t.staff.roleAssigned);
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(language === 'pl' ? 'Błąd podczas zmiany roli' : 'Помилка під час зміни ролі');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Скидання ролі (переведення в очікування PENDING)
  const handleRevokeRole = async (user: User) => {
    try {
      await apiClient.updateUserRole(user.id, 'PENDING');
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: 'PENDING' } : u))
      );
      setMessage(t.staff.revokeSuccess);
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(language === 'pl' ? 'Błąd podczas zmiany roli' : 'Помилка під час зміни ролі');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Звільнення / повне видалення користувача
  const handleFireUser = (user: User) => {
    showAlert(
      t.staff.fireConfirmTitle,
      `${t.staff.fireConfirmMsg}\n\n${user.firstName} ${user.lastName} (${user.email})`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.staff.fireStaff,
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteUser(user.id);
              setUsersList((prev) => prev.filter((u) => u.id !== user.id));
              setMessage(t.staff.fireSuccess);
              setTimeout(() => setMessage(null), 3000);
            } catch {
              setMessage(language === 'pl' ? 'Błąd podczas usuwania' : 'Помилка під час видалення');
              setTimeout(() => setMessage(null), 3000);
            }
          },
        },
      ]
    );
  };

  const pendingUsers = usersList.filter((u) => u.role === 'PENDING');
  const activeStaff = usersList.filter((u) => u.role !== 'PENDING');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Верхня навігаційна шапка */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text variant="titleMedium" style={[styles.headerTitle, { color: colors.text }]}>
            {t.staff.title}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            {t.staff.subtitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchUsers}
          style={styles.refreshButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUsers();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {message && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
            <Text style={styles.successText}>{message}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{t.common.loading}</Text>
          </View>
        ) : (
          <>
            {/* Секція нових користувачів, які очікують підтвердження (PENDING) */}
            <View style={styles.sectionHeader}>
              <Text variant="labelLarge" style={styles.pendingSectionTitle}>
                ⏳ {t.staff.pendingSection} ({pendingUsers.length})
              </Text>
            </View>

            {pendingUsers.length === 0 ? (
              <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  {t.staff.pendingEmpty}
                </Text>
              </Card>
            ) : (
              pendingUsers.map((user) => (
                <Card
                  key={user.id}
                  style={[styles.userCard, { backgroundColor: colors.surface, borderColor: '#F59E0B66' }]}
                >
                  <View style={styles.userCardContent}>
                    <Avatar.Text
                      size={48}
                      label={`${user.firstName[0] || '?'}${user.lastName[0] || ''}`}
                      style={{ backgroundColor: '#F59E0B' }}
                      color="#FFFFFF"
                    />
                    <View style={styles.userDetails}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.userName, { color: colors.text }]}>
                          {user.firstName} {user.lastName}
                        </Text>
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>
                            {t.staff.pending}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                        📱 {user.phone || '+380 00 000 0000'}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 1 }}>
                        ✉️ {user.email}
                      </Text>
                    </View>
                  </View>

                  <Divider style={{ backgroundColor: colors.divider, marginVertical: 12 }} />

                  {/* Кнопки надання ролі та відхилення */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.makeMasterBtn}
                      activeOpacity={0.8}
                      onPress={() => handleAssignRole(user.id, 'MASTER')}
                    >
                      <MaterialCommunityIcons name="account-check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnTextWhite}>{t.staff.makeMaster}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.makeAdminBtn}
                      activeOpacity={0.8}
                      onPress={() => handleAssignRole(user.id, 'ADMIN')}
                    >
                      <MaterialCommunityIcons name="shield-account" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnTextWhite}>{t.staff.makeAdmin}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      activeOpacity={0.8}
                      onPress={() => handleFireUser(user)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}

            {/* Секція активного персоналу */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                👥 {t.staff.activeSection} ({activeStaff.length})
              </Text>
            </View>

            {activeStaff.map((user) => {
              const isUserAdmin = user.role === 'ADMIN';
              const isSelf =
                user.id === currentUser?.id ||
                (currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase());

              return (
                <Card
                  key={user.id}
                  style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.userCardContent}>
                    <Avatar.Text
                      size={48}
                      label={`${user.firstName[0] || '?'}${user.lastName[0] || ''}`}
                      style={{ backgroundColor: isUserAdmin ? '#8B5CF6' : '#2563EB' }}
                      color="#FFFFFF"
                    />
                    <View style={styles.userDetails}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.userName, { color: colors.text }]}>
                          {user.firstName} {user.lastName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {isSelf && (
                            <View style={styles.selfBadge}>
                              <Text style={styles.selfBadgeText}>{t.staff.youBadge}</Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.roleBadge,
                              {
                                backgroundColor: isUserAdmin ? '#8B5CF622' : '#2563EB22',
                                borderColor: isUserAdmin ? '#8B5CF666' : '#2563EB66',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                { color: isUserAdmin ? '#A78BFA' : '#60A5FA' },
                              ]}
                            >
                              {isUserAdmin ? t.staff.admin : t.staff.master}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                        📱 {user.phone || '+380 00 000 0000'}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 1 }}>
                        ✉️ {user.email}
                      </Text>
                    </View>
                  </View>

                  {!isSelf ? (
                    <View>
                      <Divider style={{ backgroundColor: colors.divider, marginVertical: 12 }} />
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.revokeBtn}
                          activeOpacity={0.8}
                          onPress={() => handleRevokeRole(user)}
                        >
                          <MaterialCommunityIcons name="account-arrow-left" size={17} color="#F59E0B" style={{ marginRight: 6 }} />
                          <Text style={[styles.btnText, { color: '#F59E0B' }]}>{t.staff.revokeRole}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.fireBtn}
                          activeOpacity={0.8}
                          onPress={() => handleFireUser(user)}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={17} color="#EF4444" style={{ marginRight: 6 }} />
                          <Text style={[styles.btnText, { color: '#EF4444' }]}>{t.staff.fireStaff}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  refreshButton: {
    padding: 6,
    marginLeft: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98122',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  pendingSectionTitle: {
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  userCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B25',
    borderWidth: 1,
    borderColor: '#F59E0B66',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  makeMasterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  makeAdminBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF444455',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfBadge: {
    backgroundColor: '#10B98125',
    borderWidth: 1,
    borderColor: '#10B98166',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selfBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  revokeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B18',
    borderWidth: 1,
    borderColor: '#F59E0B55',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  fireBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444418',
    borderWidth: 1,
    borderColor: '#EF444455',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
