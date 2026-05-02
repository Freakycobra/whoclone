import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

// Live streamers — will be replaced by real API data
const LIVE_STREAMERS = [
  { id: '1', name: 'Sofia', flag: '🇧🇷', viewers: 243, emoji: '💃', isLive: true },
  { id: '2', name: 'Aryan', flag: '🇮🇳', viewers: 189, emoji: '🎸', isLive: true },
  { id: '3', name: 'Mia', flag: '🇵🇭', viewers: 512, emoji: '🎤', isLive: true },
  { id: '4', name: 'Zaid', flag: '🇸🇦', viewers: 78, emoji: '🎮', isLive: true },
  { id: '5', name: 'Yuna', flag: '🇰🇷', viewers: 1204, emoji: '🌸', isLive: true },
  { id: '6', name: 'Carlos', flag: '🇲🇽', viewers: 345, emoji: '🎺', isLive: true },
];

const CATEGORIES = ['All', '🔴 Live', '🎵 Music', '🎮 Gaming', '💬 Chat', '🎨 Art', '📚 Study'];

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [streamers, setStreamers] = useState(LIVE_STREAMERS);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      // Shuffle viewers counts to simulate live data
      setStreamers(prev => prev.map(s => ({
        ...s,
        viewers: Math.floor(Math.random() * 1500) + 50,
      })));
      setRefreshing(false);
    }, 1000);
  };

  const filtered = streamers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Live streams around the world</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search streamers..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={styles.categoriesContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Featured */}
        {activeCategory === 'All' && filtered.length > 0 && (
          <TouchableOpacity style={styles.featured} onPress={() => navigation.navigate('LiveStreaming')} activeOpacity={0.9}>
            <LinearGradient colors={['#1a0a2e', '#7C3AED', '#EC4899']} style={styles.featuredInner}>
              <View style={styles.featuredBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>FEATURED LIVE</Text>
              </View>
              <Text style={styles.featuredEmoji}>{filtered[0]?.emoji}</Text>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredName}>{filtered[0]?.name} {filtered[0]?.flag}</Text>
                <Text style={styles.featuredViewers}>👁 {filtered[0]?.viewers.toLocaleString()} watching</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Cards */}
        <View style={styles.cardGrid}>
          {filtered.slice(activeCategory === 'All' ? 1 : 0).map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.card}
              onPress={() => navigation.navigate('LiveStreaming')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={getCardColors(s.id)}
                style={styles.cardInner}
              >
                <View style={styles.cardLiveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
                <Text style={styles.cardEmoji}>{s.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{s.name} {s.flag}</Text>
                  <Text style={styles.cardViewers}>👁 {s.viewers.toLocaleString()}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No streamers found</Text>
            <Text style={styles.emptySub}>Try a different search</Text>
          </View>
        )}

        {/* Start streaming CTA */}
        <TouchableOpacity style={styles.goLiveCta} onPress={() => navigation.navigate('LiveStreaming')} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(239,68,68,0.2)', 'rgba(236,72,153,0.2)']} style={styles.goLiveCtaInner}>
            <Text style={styles.goLiveCtaIcon}>📡</Text>
            <View style={styles.goLiveCtaContent}>
              <Text style={styles.goLiveCtaTitle}>Start your own stream</Text>
              <Text style={styles.goLiveCtaSub}>Go live and earn diamonds</Text>
            </View>
            <Text style={styles.goLiveCtaArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function getCardColors(id) {
  const palettes = [
    ['#1a0a2e', '#2d1b69'],
    ['#0a1a2e', '#1b2d69'],
    ['#1a2e0a', '#2d6928'],
    ['#2e1a0a', '#692d1b'],
    ['#0a2e2a', '#1b6960'],
    ['#2e0a2a', '#691b60'],
  ];
  return palettes[parseInt(id) % palettes.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  searchRow: { paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: colors.cardBorder, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 10 },
  searchClear: { color: colors.textMuted, fontSize: 16, padding: 4 },
  categories: { flexGrow: 0 },
  categoriesContent: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.cardBorder },
  catChipActive: { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: colors.primary },
  catText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: colors.primary },
  grid: { paddingHorizontal: 20 },
  featured: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, height: 180 },
  featuredInner: { flex: 1, justifyContent: 'space-between', padding: 16 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  featuredEmoji: { fontSize: 60, textAlign: 'center' },
  featuredInfo: {},
  featuredName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  featuredViewers: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: { width: CARD_W, borderRadius: 16, overflow: 'hidden', height: 150 },
  cardInner: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardEmoji: { fontSize: 40, textAlign: 'center', flex: 1, textAlignVertical: 'center' },
  cardInfo: {},
  cardName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardViewers: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  goLiveCta: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  goLiveCtaInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  goLiveCtaIcon: { fontSize: 28 },
  goLiveCtaContent: { flex: 1 },
  goLiveCtaTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  goLiveCtaSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  goLiveCtaArrow: { color: colors.error, fontSize: 18, fontWeight: '700' },
});
