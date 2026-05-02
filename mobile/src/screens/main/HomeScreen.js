import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Animated, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

const { width } = Dimensions.get('window');

const COUNTRIES = [
  { code: null, label: 'Any Country', flag: '🌍' },
  { code: 'IN', label: 'India', flag: '🇮🇳' },
  { code: 'BD', label: 'Bangladesh', flag: '🇧🇩' },
  { code: 'ID', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', label: 'Philippines', flag: '🇵🇭' },
  { code: 'TR', label: 'Turkey', flag: '🇹🇷' },
  { code: 'PK', label: 'Pakistan', flag: '🇵🇰' },
  { code: 'AE', label: 'UAE', flag: '🇦🇪' },
  { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'US', label: 'USA', flag: '🇺🇸' },
  { code: 'GB', label: 'UK', flag: '🇬🇧' },
];

const GENDERS = [
  { code: null, label: 'Any Gender', icon: '⚧' },
  { code: 'male', label: 'Male', icon: '👨' },
  { code: 'female', label: 'Female', icon: '👩' },
];

export default function HomeScreen({ navigation }) {
  const { user, addCoins } = useAuthStore();
  const { genderFilter, countryFilter, setGenderFilter, setCountryFilter } = useChatStore();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [onlineCount] = useState(Math.floor(Math.random() * 3000) + 8000);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleStartMatch = () => navigation.navigate('VideoChat');

  const handleFilterPress = (type) => {
    if (!user?.isVip) {
      Alert.alert('VIP Feature', 'Upgrade to VIP to use filters!', [
        { text: 'Later', style: 'cancel' },
        { text: 'Get VIP', onPress: () => navigation.navigate('Premium') },
      ]);
      return;
    }
    if (type === 'country') setShowCountryModal(true);
    else setShowGenderModal(true);
  };

  const handleClaimBonus = () => {
    if (dailyClaimed) {
      Alert.alert('Already claimed', 'Come back tomorrow for your next bonus!');
      return;
    }
    addCoins(50);
    setDailyClaimed(true);
    Alert.alert('🎁 Bonus claimed!', 'You received 50 free coins!');
  };

  const selectedCountry = COUNTRIES.find(c => c.code === countryFilter) || COUNTRIES[0];
  const selectedGender = GENDERS.find(g => g.code === genderFilter) || GENDERS[0];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()} 👋</Text>
            <Text style={styles.username}>{user?.displayName || 'Explorer'}</Text>
          </View>
          <TouchableOpacity style={styles.coinBadge} onPress={() => navigation.navigate('CoinStore')}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinAmount}>{user?.coins || 0}</Text>
            <Text style={styles.coinPlus}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Online bar */}
        <View style={styles.onlineBar}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>
            <Text style={styles.onlineCount}>{onlineCount.toLocaleString()}</Text> people online now
          </Text>
        </View>

        {/* START button */}
        <View style={styles.startSection}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity onPress={handleStartMatch} activeOpacity={0.9}>
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.startButton}
              >
                <Text style={styles.startEmoji}>⚡</Text>
                <Text style={styles.startText}>START</Text>
                <Text style={styles.startSubText}>Tap to match</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Filters */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterChip, genderFilter && styles.filterChipActive]}
              onPress={() => handleFilterPress('gender')}
            >
              <Text style={styles.filterIcon}>{selectedGender.icon}</Text>
              <Text style={styles.filterText}>{selectedGender.label}</Text>
              {!user?.isVip && <Text style={styles.vipLock}>👑</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, countryFilter && styles.filterChipActive]}
              onPress={() => handleFilterPress('country')}
            >
              <Text style={styles.filterIcon}>{selectedCountry.flag}</Text>
              <Text style={styles.filterText}>{selectedCountry.label}</Text>
              {!user?.isVip && <Text style={styles.vipLock}>👑</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* VIP banner */}
        {!user?.isVip && (
          <TouchableOpacity style={styles.vipBanner} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
            <LinearGradient
              colors={['rgba(124,58,237,0.3)', 'rgba(236,72,153,0.3)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.vipBannerGradient}
            >
              <Text style={styles.vipBannerIcon}>👑</Text>
              <View style={styles.vipBannerContent}>
                <Text style={styles.vipBannerTitle}>Upgrade to VIP</Text>
                <Text style={styles.vipBannerSub}>Gender filter · No ads · 3x faster matching</Text>
              </View>
              <Text style={styles.vipBannerArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Daily bonus */}
        <View style={[styles.bonusCard, dailyClaimed && styles.bonusCardClaimed]}>
          <Text style={styles.bonusIcon}>{dailyClaimed ? '✅' : '🎁'}</Text>
          <View style={styles.bonusContent}>
            <Text style={styles.bonusTitle}>{dailyClaimed ? 'Bonus Claimed!' : 'Daily Bonus Available!'}</Text>
            <Text style={styles.bonusSub}>{dailyClaimed ? 'Come back tomorrow' : 'Claim 50 free coins today'}</Text>
          </View>
          {!dailyClaimed && (
            <TouchableOpacity style={styles.bonusClaim} onPress={handleClaimBonus}>
              <Text style={styles.bonusClaimText}>Claim</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('LiveStreaming')}>
              <LinearGradient colors={['#7C3AED20', '#7C3AED40']} style={styles.qaGradient}>
                <Text style={styles.qaIcon}>📡</Text>
                <Text style={styles.qaTitle}>Go Live</Text>
                <Text style={styles.qaSub}>Start streaming</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('CoinStore')}>
              <LinearGradient colors={['#F59E0B20', '#F59E0B40']} style={styles.qaGradient}>
                <Text style={styles.qaIcon}>🪙</Text>
                <Text style={styles.qaTitle}>Get Coins</Text>
                <Text style={styles.qaSub}>Send gifts</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <LinearGradient colors={['#EC489920', '#EC489940']} style={styles.qaGradient}>
                <Text style={styles.qaIcon}>👥</Text>
                <Text style={styles.qaTitle}>Friends</Text>
                <Text style={styles.qaSub}>{user?.friends || 0} online</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Country filter modal */}
      <Modal visible={showCountryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.code || 'any'}
                  style={[styles.modalItem, countryFilter === c.code && styles.modalItemActive]}
                  onPress={() => { setCountryFilter(c.code); setShowCountryModal(false); }}
                >
                  <Text style={styles.modalItemFlag}>{c.flag}</Text>
                  <Text style={[styles.modalItemLabel, countryFilter === c.code && styles.modalItemLabelActive]}>
                    {c.label}
                  </Text>
                  {countryFilter === c.code && <Text style={styles.modalCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCountryModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender filter modal */}
      <Modal visible={showGenderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.code || 'any'}
                style={[styles.modalItem, genderFilter === g.code && styles.modalItemActive]}
                onPress={() => { setGenderFilter(g.code); setShowGenderModal(false); }}
              >
                <Text style={styles.modalItemFlag}>{g.icon}</Text>
                <Text style={[styles.modalItemLabel, genderFilter === g.code && styles.modalItemLabelActive]}>
                  {g.label}
                </Text>
                {genderFilter === g.code && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowGenderModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  greeting: { color: colors.textSecondary, fontSize: 13 },
  username: { color: '#fff', fontSize: 22, fontWeight: '800' },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', gap: 6,
  },
  coinIcon: { fontSize: 16 },
  coinAmount: { color: colors.gold, fontWeight: '700', fontSize: 14 },
  coinPlus: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  onlineBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24, gap: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  onlineText: { color: colors.textSecondary, fontSize: 13 },
  onlineCount: { color: colors.success, fontWeight: '700' },
  startSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  glowRing: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 2, borderColor: 'rgba(124,58,237,0.3)',
  },
  startButton: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
  startEmoji: { fontSize: 36, marginBottom: 4 },
  startText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  startSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  filtersRow: { flexDirection: 'row', gap: 12 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.cardBorder, gap: 6,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  filterIcon: { fontSize: 14 },
  filterText: { color: colors.textSecondary, fontSize: 13 },
  vipLock: { fontSize: 12 },
  vipBanner: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  vipBannerGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)', borderRadius: 16, gap: 12,
  },
  vipBannerIcon: { fontSize: 28 },
  vipBannerContent: { flex: 1 },
  vipBannerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  vipBannerSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  vipBannerArrow: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  bonusCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', gap: 12,
  },
  bonusCardClaimed: { opacity: 0.6 },
  bonusIcon: { fontSize: 28 },
  bonusContent: { flex: 1 },
  bonusTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bonusSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  bonusClaim: { backgroundColor: colors.success, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  bonusClaimText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 14 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  qaGradient: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder },
  qaIcon: { fontSize: 28, marginBottom: 8 },
  qaTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  qaSub: { color: colors.textSecondary, fontSize: 11 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#16161F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '70%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, marginBottom: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  modalItemActive: { backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: colors.primary },
  modalItemFlag: { fontSize: 22 },
  modalItemLabel: { flex: 1, color: colors.textSecondary, fontSize: 15 },
  modalItemLabelActive: { color: '#fff', fontWeight: '600' },
  modalCheck: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  modalClose: { marginTop: 8, padding: 16, alignItems: 'center' },
  modalCloseText: { color: colors.textMuted, fontSize: 15 },
});
