import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useLiveStore } from '../../store/liveStore';

const { width } = Dimensions.get('window');

const TABS = ['🎁 Top Gifters', '💎 Top Earners', '👑 Top VIPs', '⭐ Popular'];

// Fallback mock data if backend has no real data yet
const MOCK = {
  '🎁 Top Gifters': [
    { rank: 1, name: 'Carlos', flag: '🇲🇽', value: 45600, label: 'coins spent', emoji: '🎁' },
    { rank: 2, name: 'Zaid', flag: '🇸🇦', value: 38900, label: 'coins spent', emoji: '🎁' },
    { rank: 3, name: 'Yuna', flag: '🇰🇷', value: 29300, label: 'coins spent', emoji: '🎁' },
    { rank: 4, name: 'Aryan', flag: '🇮🇳', value: 21700, label: 'coins spent', emoji: '🎁' },
    { rank: 5, name: 'Ahmed', flag: '🇧🇩', value: 18400, label: 'coins spent', emoji: '🎁' },
    { rank: 6, name: 'Marco', flag: '🇵🇭', value: 14200, label: 'coins spent', emoji: '🎁' },
    { rank: 7, name: 'Sofia', flag: '🇧🇷', value: 10800, label: 'coins spent', emoji: '🎁' },
    { rank: 8, name: 'Priya', flag: '🇮🇳', value: 8600, label: 'coins spent', emoji: '🎁' },
    { rank: 9, name: 'Mia', flag: '🇵🇭', value: 6200, label: 'coins spent', emoji: '🎁' },
    { rank: 10, name: 'Fatima', flag: '🇸🇦', value: 4100, label: 'coins spent', emoji: '🎁' },
  ],
  '💎 Top Earners': [
    { rank: 1, name: 'Yuna', flag: '🇰🇷', value: 124500, label: 'diamonds', emoji: '💎' },
    { rank: 2, name: 'Sofia', flag: '🇧🇷', value: 98200, label: 'diamonds', emoji: '💎' },
    { rank: 3, name: 'Aryan', flag: '🇮🇳', value: 87600, label: 'diamonds', emoji: '💎' },
    { rank: 4, name: 'Mia', flag: '🇵🇭', value: 73400, label: 'diamonds', emoji: '💎' },
    { rank: 5, name: 'Zaid', flag: '🇸🇦', value: 65100, label: 'diamonds', emoji: '💎' },
    { rank: 6, name: 'Carlos', flag: '🇲🇽', value: 54800, label: 'diamonds', emoji: '💎' },
    { rank: 7, name: 'Priya', flag: '🇮🇳', value: 43200, label: 'diamonds', emoji: '💎' },
    { rank: 8, name: 'Ahmed', flag: '🇧🇩', value: 38900, label: 'diamonds', emoji: '💎' },
    { rank: 9, name: 'Fatima', flag: '🇸🇦', value: 29700, label: 'diamonds', emoji: '💎' },
    { rank: 10, name: 'Marco', flag: '🇵🇭', value: 21300, label: 'diamonds', emoji: '💎' },
  ],
  '👑 Top VIPs': [
    { rank: 1, name: 'Yuna', flag: '🇰🇷', value: 365, label: 'days VIP', emoji: '👑' },
    { rank: 2, name: 'Carlos', flag: '🇲🇽', value: 280, label: 'days VIP', emoji: '👑' },
    { rank: 3, name: 'Sofia', flag: '🇧🇷', value: 210, label: 'days VIP', emoji: '👑' },
    { rank: 4, name: 'Zaid', flag: '🇸🇦', value: 180, label: 'days VIP', emoji: '👑' },
    { rank: 5, name: 'Priya', flag: '🇮🇳', value: 150, label: 'days VIP', emoji: '👑' },
    { rank: 6, name: 'Aryan', flag: '🇮🇳', value: 120, label: 'days VIP', emoji: '👑' },
    { rank: 7, name: 'Mia', flag: '🇵🇭', value: 90, label: 'days VIP', emoji: '👑' },
    { rank: 8, name: 'Ahmed', flag: '🇧🇩', value: 60, label: 'days VIP', emoji: '👑' },
    { rank: 9, name: 'Marco', flag: '🇵🇭', value: 30, label: 'days VIP', emoji: '👑' },
    { rank: 10, name: 'Fatima', flag: '🇸🇦', value: 14, label: 'days VIP', emoji: '👑' },
  ],
  '⭐ Popular': [
    { rank: 1, name: 'Mia', flag: '🇵🇭', value: 8920, label: 'fans', emoji: '⭐' },
    { rank: 2, name: 'Yuna', flag: '🇰🇷', value: 7430, label: 'fans', emoji: '⭐' },
    { rank: 3, name: 'Sofia', flag: '🇧🇷', value: 6210, label: 'fans', emoji: '⭐' },
    { rank: 4, name: 'Priya', flag: '🇮🇳', value: 5890, label: 'fans', emoji: '⭐' },
    { rank: 5, name: 'Aryan', flag: '🇮🇳', value: 4560, label: 'fans', emoji: '⭐' },
    { rank: 6, name: 'Carlos', flag: '🇲🇽', value: 3780, label: 'fans', emoji: '⭐' },
    { rank: 7, name: 'Zaid', flag: '🇸🇦', value: 2940, label: 'fans', emoji: '⭐' },
    { rank: 8, name: 'Ahmed', flag: '🇧🇩', value: 2100, label: 'fans', emoji: '⭐' },
    { rank: 9, name: 'Marco', flag: '🇵🇭', value: 1680, label: 'fans', emoji: '⭐' },
    { rank: 10, name: 'Fatima', flag: '🇸🇦', value: 1230, label: 'fans', emoji: '⭐' },
  ],
};

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const { fetchLeaderboard, leaderboard, leaderboardLoading } = useLiveStore();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard(true);
    setRefreshing(false);
  };

  // Merge real backend data with mock fallback
  const getTabData = () => {
    if (activeTab === '🎁 Top Gifters' && leaderboard?.topGifters?.length > 0) {
      return leaderboard.topGifters;
    }
    if (activeTab === '💎 Top Earners' && leaderboard?.topEarners?.length > 0) {
      return leaderboard.topEarners;
    }
    return MOCK[activeTab] || [];
  };

  const data = getTabData();
  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top players this week</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Top 3 podium */}
        {top3.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd */}
            <View style={[styles.podiumItem, styles.podiumSecond]}>
              <Text style={styles.podiumEmoji}>{top3[1]?.flag}</Text>
              <Text style={styles.podiumRankEmoji}>🥈</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.name}</Text>
              <Text style={styles.podiumValue}>{top3[1]?.emoji} {top3[1]?.value?.toLocaleString()}</Text>
            </View>
            {/* 1st */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.podiumCrown}>
                <Text style={styles.podiumCrownText}>👑</Text>
              </LinearGradient>
              <Text style={styles.podiumEmojiLarge}>{top3[0]?.flag}</Text>
              <Text style={styles.podiumRankEmoji}>🥇</Text>
              <Text style={styles.podiumNameLarge} numberOfLines={1}>{top3[0]?.name}</Text>
              <Text style={styles.podiumValue}>{top3[0]?.emoji} {top3[0]?.value?.toLocaleString()}</Text>
            </View>
            {/* 3rd */}
            <View style={[styles.podiumItem, styles.podiumThird]}>
              <Text style={styles.podiumEmoji}>{top3[2]?.flag}</Text>
              <Text style={styles.podiumRankEmoji}>🥉</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.name}</Text>
              <Text style={styles.podiumValue}>{top3[2]?.emoji} {top3[2]?.value?.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Rest of list */}
        <View style={styles.list}>
          {rest.map((item) => (
            <View key={item.rank} style={styles.listItem}>
              <Text style={styles.listRank}>#{item.rank}</Text>
              <Text style={styles.listFlag}>{item.flag}</Text>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.listValue}>{item.emoji} {item.value.toLocaleString()}</Text>
              <Text style={styles.listLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Your rank */}
        <View style={styles.yourRank}>
          <LinearGradient colors={['rgba(124,58,237,0.2)', 'rgba(236,72,153,0.2)']} style={styles.yourRankInner}>
            <Text style={styles.yourRankLabel}>Your Rank</Text>
            <Text style={styles.yourRankValue}>#--</Text>
            <Text style={styles.yourRankSub}>Send gifts or go live to climb the leaderboard!</Text>
            {leaderboard?.updatedAt && (
              <Text style={styles.updatedAt}>Updated {new Date(leaderboard.updatedAt).toLocaleTimeString()}</Text>
            )}
          </LinearGradient>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  tabs: { flexGrow: 0, marginTop: 16 },
  tabsContent: { paddingHorizontal: 20, gap: 8, marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.cardBorder },
  tabActive: { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 24, gap: 8 },
  podiumItem: { flex: 1, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  podiumFirst: { paddingTop: 8, borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.05)' },
  podiumSecond: { borderColor: '#C0C0C0', backgroundColor: 'rgba(192,192,192,0.05)' },
  podiumThird: { borderColor: '#CD7F32', backgroundColor: 'rgba(205,127,50,0.05)' },
  podiumCrown: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  podiumCrownText: { fontSize: 20 },
  podiumEmoji: { fontSize: 32, marginBottom: 4 },
  podiumEmojiLarge: { fontSize: 40, marginBottom: 4 },
  podiumRankEmoji: { fontSize: 24, marginBottom: 4 },
  podiumName: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  podiumNameLarge: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  podiumValue: { color: colors.gold, fontSize: 11, marginTop: 4, textAlign: 'center' },

  list: { paddingHorizontal: 20, gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, gap: 10 },
  listRank: { color: colors.textMuted, fontSize: 14, fontWeight: '700', width: 28 },
  listFlag: { fontSize: 24 },
  listName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
  listValue: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  listLabel: { color: colors.textMuted, fontSize: 10 },

  yourRank: { margin: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  yourRankInner: { padding: 20, alignItems: 'center' },
  yourRankLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  yourRankValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 4 },
  yourRankSub: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  updatedAt: { color: colors.textMuted, fontSize: 10, marginTop: 8 },
});
