import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar, Divider, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSettings } from '../../context/AppSettingsContext';
import { authService } from '../../services/authService';
import { Language } from '../../constants/i18n';

/**
 * Екран: Налаштування та меню ("Ще")
 * Реалізація: Артем Лабунський (Розробник 3)
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme, language, setLanguage, t } = useAppSettings();
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isMaster = currentUser?.role === 'MASTER';

  const handleLogout = () => {
    authService.logout();
    router.replace('/');
  };

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setIsLangModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Шапка профілю */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.profileRow}>
            <Avatar.Text
              size={52}
              label={
                currentUser
                  ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
                  : 'HU'
              }
              style={{ backgroundColor: isAdmin ? '#8B5CF6' : '#2563EB' }}
              color="#FFFFFF"
            />
            <View style={styles.profileInfo}>
              <Text variant="titleMedium" style={[styles.userName, { color: colors.text }]}>
                {currentUser
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : 'Yulia Hizhovska'}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {currentUser?.phone || '+380 67 000 0000'}
              </Text>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: isAdmin ? '#8B5CF622' : '#2563EB22' },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: isAdmin ? '#A78BFA' : '#60A5FA' },
                  ]}
                >
                  {isAdmin
                    ? t.settings.profileRoleAdmin
                    : t.settings.profileRoleMaster}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Секція швидких дій / модулів */}
        <View style={[styles.menuBlock, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Пункт: Персонал (тільки для адміністратора) */}
          {isAdmin && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => router.push('/staff')}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: '#8B5CF618' }]}>
                    <MaterialCommunityIcons name="account-group" size={22} color="#A78BFA" />
                  </View>
                  <View>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {t.settings.staff}
                    </Text>
                    <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                      {t.settings.staffSubtitle}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <Divider style={{ backgroundColor: colors.divider }} />
            </>
          )}

          {/* Пункт: Аналітика / Статистика (тільки для адміністратора) */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/statistics')}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconWrap, { backgroundColor: '#38BDF818' }]}>
                  <MaterialCommunityIcons name="chart-pie" size={22} color="#38BDF8" />
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {t.settings.analytics}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    {t.settings.analyticsSubtitle}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Пункт: Зарплата майстра (тільки для майстра, приховано для адміна) */}
          {isMaster && !isAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/salary')}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconWrap, { backgroundColor: '#10B98118' }]}>
                  <MaterialCommunityIcons name="wallet" size={22} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {t.settings.salary}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    {t.settings.salarySubtitle}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Секція налаштувань інтерфейсу (Тема та Мова) */}
        <View style={[styles.menuBlock, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* Пункт: Темна тема */}
          <View style={styles.menuItem}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#F59E0B18' }]}>
                <MaterialCommunityIcons
                  name={isDark ? 'weather-night' : 'white-balance-sunny'}
                  size={22}
                  color="#F59E0B"
                />
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {t.settings.darkTheme}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Divider style={{ backgroundColor: colors.divider }} />

          {/* Пункт: Вибір мови */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => setIsLangModalVisible(true)}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#6366F118' }]}>
                <Text style={{ fontSize: 18 }}>{language === 'ua' ? '🇺🇦' : '🇵🇱'}</Text>
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {language === 'ua' ? t.settings.ukrainian : t.settings.polish}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Кнопка виходу (як на скріншоті користувача) */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#FF453A" style={{ marginRight: 12 }} />
          <Text style={[styles.logoutText, { color: colors.text }]}>
            {t.settings.logout}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Модальне вікно вибору мови */}
      <Modal
        visible={isLangModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsLangModalVisible(false)}
        >
          <View
            style={[
              styles.modalDialog,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <Text variant="titleMedium" style={[styles.modalTitle, { color: colors.text }]}>
              {t.settings.selectLanguage}
            </Text>

            <TouchableOpacity
              style={[
                styles.langOption,
                language === 'pl' && { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
              ]}
              onPress={() => selectLanguage('pl')}
            >
              <Text style={styles.langFlag}>🇵🇱</Text>
              <Text style={[styles.langText, { color: colors.text }]}>
                {t.settings.polish} (Polski)
              </Text>
              {language === 'pl' && (
                <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>

            <Divider style={{ backgroundColor: colors.divider }} />

            <TouchableOpacity
              style={[
                styles.langOption,
                language === 'ua' && { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
              ]}
              onPress={() => selectLanguage('ua')}
            >
              <Text style={styles.langFlag}>🇺🇦</Text>
              <Text style={[styles.langText, { color: colors.text }]}>
                {t.settings.ukrainian} (Українська)
              </Text>
              {language === 'ua' && (
                <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    fontSize: 17,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  menuBlock: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  langFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  langText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
