import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '../context/AppSettingsContext';
import { apiClient } from '../services/api';
import { authService } from '../services/authService';
import { User, UserRole } from '../constants/types';

/**
 * Екран: Персонал та надання ролей (Staff Management)
 * Зона відповідальності: Артем Лабунський (Розробник 3)
 */
export default function StaffScreen() {
  const router = useRouter();
  const { colors, t } = useAppSettings();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getUsers();
      setUsersList(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(tabs)/settings');
      return;
    }
    fetchUsers();
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
      setMessage('Помилка під час зміни ролі');
      setTimeout(() => setMessage(null), 3000);
    }
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

                  {/* Кнопки надання ролі */}
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
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                        📱 {user.phone || '+380 00 000 0000'}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 1 }}>
                        ✉️ {user.email}
                      </Text>
                    </View>
                  </View>
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
});
