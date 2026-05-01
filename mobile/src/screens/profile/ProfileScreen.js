import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

const MENU_ITEMS = [
  { id: 'friends', icon: '👥', label: 'Friends', badge: null },
  { id: 'history', icon: '📋', label: 'Chat History', badge: null },
  { id: 'earnings', icon: '💎', label: 'Diamond Earnings', badge: 'NEW' },
  { id: 'settings', icon: '⚙️', label: 'Settings', badge: null },
  { id: 'notifications', icon: '🔔', label: 'Notifications', badge: '3' },
  { id: 'language', icon: '🌍', label: 'Language', badge: null },
  { id: 'privacy', icon: '🔒', label: 'Privacy & Safety', badge: null },
  { id: 'help', icon: '❓', label: 'Help & Support', badge: null },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();

  const genderEmoji = { male: '👨', female: '👩', nonbinary: '🧑' };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <LinearGradient
          colors={['#1a0a2e', '#13131A']}
          style={styles.profileCard}
        >
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={['#7C3AED', '#EC4899']} style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>
                {genderEmoji[user?.gender] || '😊'}
              </Text>
            </LinearGradient>
            {user?.isVip && (
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>👑 VIP</Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.displayName || 'Explorer'}</Text>
          <Text style={styles.userMeta}>
            {user?.age || '—'} · {user?.gender || '—'} · {user?.country || '🌍'}
          </Text>
          {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🪙 {user?.coins || 0}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>💎 {user?.diamonds || 0}</Text>
              <Text style={styles.statLabel}>Diamonds</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>👥 {user?.friends || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>

          {/* Edit & VIP buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
            {!user?.isVip && (
              <TouchableOpacity
                style={styles.vipUpgradeBtn}
                onPress={() => navigation.navigate('CoinStore')}
              >
                <LinearGradient
                  colors={['#7C3AED', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.vipUpgradeBtnGradient}
                >
                  <Text style={styles.vipUpgradeBtnText}>👑 Get VIP</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Top up button */}
        <TouchableOpacity
          style={styles.topUpBtn}
          onPress={() => navigation.navigate('CoinStore')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']}
            style={styles.topUpBtnInner}
          >
            <Text style={styles.topUpIcon}>🪙</Text>
            <View style={styles.topUpContent}>
              <Text style={styles.topUpTitle}>Get Coins</Text>
              <Text style={styles.topUpSub}>Send gifts · Support creators</Text>
            </View>
            <Text style={styles.topUpArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.badge && (
                  <View style={[
                    styles.menuBadge,
                    item.badge === 'NEW' && styles.menuBadgeNew,
                  ]}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Text style={styles.menuChevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Log Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: logout },
          ])}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ConnectNow v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileCard: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 44 },
  vipBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: colors.background,
  },
  vipBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  userName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  userMeta: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  userBio: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.cardBorder },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  editBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  vipUpgradeBtn: { flex: 1, borderRadius: 21, overflow: 'hidden' },
  vipUpgradeBtnGradient: { height: 42, alignItems: 'center', justifyContent: 'center' },
  vipUpgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  topUpBtn: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  topUpBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 16,
    gap: 12,
  },
  topUpIcon: { fontSize: 28 },
  topUpContent: { flex: 1 },
  topUpTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  topUpSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  topUpArrow: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  menuCard: {
    marginHorizontal: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  menuIcon: { fontSize: 20, width: 26 },
  menuLabel: { flex: 1, color: '#fff', fontSize: 15 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  menuBadgeNew: { backgroundColor: colors.primary },
  menuBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  menuChevron: { color: colors.textMuted, fontSize: 20 },
  logoutBtn: {
    marginHorizontal: 20,
    marginBottom: 12,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  version: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 8 },
});
