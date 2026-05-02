import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { VIP_PERKS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useRegionalPricing } from '../../hooks/useRegionalPricing';

const { width } = Dimensions.get('window');

export default function CoinStoreScreen({ navigation }) {
  const { user, addCoins } = useAuthStore();
  const [activeTab, setActiveTab] = useState('coins');
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const { packs, subPlans: plans, loading: pricingLoading } = useRegionalPricing();
  const currency = packs[0]?.currency || '$';

  const handlePurchase = (pack) => {
    Alert.alert(
      `Buy ${pack.coins} Coins`,
      `Price: ${pack.currency || '$'}${pack.price}\n\nThis will open Google Play payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => {
            addCoins(pack.coins);
            Alert.alert('✅ Purchase Successful!', `${pack.coins} coins added to your account.`);
          },
        },
      ]
    );
  };

  const handleVIPPurchase = (plan) => {
    Alert.alert(
      'Get VIP',
      `${plan.label || 'VIP'}: ${plan.currency || '$'}${plan.price}/${plan.period}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => Alert.alert('🎉 Welcome to VIP!', 'Your VIP benefits are now active.') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Coins & VIP</Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceIcon}>🪙</Text>
          <Text style={styles.balanceText}>{user?.coins || 0}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coins' && styles.tabActive]}
          onPress={() => setActiveTab('coins')}
        >
          <Text style={[styles.tabText, activeTab === 'coins' && styles.tabTextActive]}>🪙 Coins</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vip' && styles.tabActive]}
          onPress={() => setActiveTab('vip')}
        >
          <Text style={[styles.tabText, activeTab === 'vip' && styles.tabTextActive]}>👑 VIP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'coins' ? (
          <View style={styles.content}>
            {/* Flash deal banner */}
            <LinearGradient
              colors={['rgba(245,158,11,0.2)', 'rgba(239,68,68,0.2)']}
              style={styles.flashBanner}
            >
              <Text style={styles.flashIcon}>⚡</Text>
              <View>
                <Text style={styles.flashTitle}>Flash Sale — 20% Extra Coins!</Text>
                <Text style={styles.flashSub}>Ends in 02:47:33 · Today only</Text>
              </View>
            </LinearGradient>

            {/* Loyalty progress */}
            <View style={styles.loyaltyCard}>
              <Text style={styles.loyaltyTitle}>Loyalty Bonus 🎖️</Text>
              <Text style={styles.loyaltySub}>Buy 3x in a row → 10% extra coins</Text>
              <View style={styles.loyaltyProgress}>
                <View style={[styles.loyaltyDot, styles.loyaltyDotActive]} />
                <View style={styles.loyaltyLine} />
                <View style={styles.loyaltyDot} />
                <View style={styles.loyaltyLine} />
                <View style={styles.loyaltyDot} />
              </View>
              <Text style={styles.loyaltyHint}>1/3 purchases towards bonus</Text>
            </View>

            {/* Coin packs */}
            <Text style={styles.sectionLabel}>Choose a pack</Text>
            {pricingLoading ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 20 }}>Loading prices...</Text>
            ) : (
              packs.map((pack) => (
                <TouchableOpacity
                  key={pack.id}
                  onPress={() => handlePurchase(pack)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={pack.badge ? ['rgba(124,58,237,0.2)', 'rgba(236,72,153,0.2)'] : ['#16161F', '#1C1C27']}
                    style={[styles.packCard, pack.badge && styles.packCardFeatured]}
                  >
                    {pack.badge && (
                      <View style={styles.packBadge}>
                        <Text style={styles.packBadgeText}>{pack.badge}</Text>
                      </View>
                    )}
                    <View style={styles.packLeft}>
                      <Text style={styles.packEmoji}>🪙</Text>
                      <View>
                        <Text style={styles.packCoins}>{pack.coins.toLocaleString()} coins</Text>
                        <Text style={styles.packLabel}>{pack.label}</Text>
                      </View>
                    </View>
                    <View style={styles.packRight}>
                      <LinearGradient
                        colors={['#7C3AED', '#EC4899']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.packBuyBtn}
                      >
                        <Text style={styles.packPrice}>{pack.currency || '$'}{pack.price}</Text>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}

            {/* Milestone bonus */}
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneTitle}>🎯 Milestone Bonuses</Text>
              <View style={styles.milestoneRow}>
                <Text style={styles.milestoneItem}>Buy 3,000 coins total</Text>
                <Text style={styles.milestoneBonus}>+1,000 FREE</Text>
              </View>
              <View style={styles.milestoneRow}>
                <Text style={styles.milestoneItem}>Buy 10,000 coins total</Text>
                <Text style={styles.milestoneBonus}>+3,000 FREE</Text>
              </View>
              <View style={styles.milestoneRow}>
                <Text style={styles.milestoneItem}>Buy 3x this week</Text>
                <Text style={styles.milestoneBonus}>+20% on next</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {/* VIP perks */}
            <LinearGradient
              colors={['rgba(124,58,237,0.2)', 'rgba(236,72,153,0.2)']}
              style={styles.vipHeader}
            >
              <Text style={styles.vipHeaderIcon}>👑</Text>
              <Text style={styles.vipHeaderTitle}>ConnectNow VIP</Text>
              <Text style={styles.vipHeaderSub}>Unlock the full experience</Text>
            </LinearGradient>

            <View style={styles.perksCard}>
              {VIP_PERKS.map((perk, i) => (
                <View key={i} style={styles.perkRow}>
                  <Text style={styles.perkIcon}>{perk.icon}</Text>
                  <Text style={styles.perkText}>{perk.text}</Text>
                </View>
              ))}
            </View>

            {/* Plan selector */}
            <Text style={styles.sectionLabel}>Choose your plan</Text>
            {pricingLoading ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 20 }}>Loading prices...</Text>
            ) : (
              <>
                <View style={styles.planSelector}>
                  {Object.entries(plans).map(([key, plan]) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.planChip, selectedPlan === key && styles.planChipActive]}
                      onPress={() => setSelectedPlan(key)}
                    >
                      {plan.badge && <Text style={styles.planBadge}>{plan.badge}</Text>}
                      <Text style={[styles.planPeriod, selectedPlan === key && styles.planPeriodActive]}>
                        {plan.period.charAt(0).toUpperCase() + plan.period.slice(1)}
                      </Text>
                      <Text style={[styles.planPrice, selectedPlan === key && styles.planPriceActive]}>
                        {plan.currency || '$'}{plan.price}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => handleVIPPurchase(plans[selectedPlan])}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.vipCtaBtn}
                  >
                    <Text style={styles.vipCtaText}>
                      👑 Get VIP — {plans[selectedPlan]?.currency || '$'}{plans[selectedPlan]?.price}/{plans[selectedPlan]?.period}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.vipNote}>
                  Cancel anytime · Auto-renews · Prices in local currency
                </Text>
              </>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  balanceIcon: { fontSize: 14 },
  balanceText: { color: colors.gold, fontWeight: '700', fontSize: 13 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 20 },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  flashIcon: { fontSize: 28 },
  flashTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  flashSub: { color: colors.warning, fontSize: 12, marginTop: 2 },
  loyaltyCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  loyaltyTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  loyaltySub: { color: colors.textSecondary, fontSize: 12, marginBottom: 12 },
  loyaltyProgress: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  loyaltyDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.cardBorder,
    borderWidth: 2, borderColor: colors.textMuted,
  },
  loyaltyDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  loyaltyLine: { flex: 1, height: 2, backgroundColor: colors.cardBorder },
  loyaltyHint: { color: colors.textMuted, fontSize: 11 },
  sectionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  packCardFeatured: { borderColor: 'rgba(124,58,237,0.5)' },
  packBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: colors.primary,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  packBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  packLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  packEmoji: { fontSize: 32 },
  packCoins: { color: '#fff', fontSize: 16, fontWeight: '700' },
  packLabel: { color: colors.textSecondary, fontSize: 12 },
  packRight: {},
  packBuyBtn: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  packPrice: { color: '#fff', fontSize: 14, fontWeight: '700' },
  milestoneCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16, padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  milestoneTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  milestoneItem: { color: colors.textSecondary, fontSize: 13 },
  milestoneBonus: { color: colors.success, fontSize: 13, fontWeight: '700' },
  vipHeader: {
    borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  vipHeaderIcon: { fontSize: 48, marginBottom: 8 },
  vipHeaderTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  vipHeaderSub: { color: colors.textSecondary, fontSize: 14 },
  perksCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  perkIcon: { fontSize: 22, width: 28 },
  perkText: { color: '#fff', fontSize: 14, flex: 1 },
  planSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  planChip: {
    flex: 1, borderRadius: 16, borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.backgroundSecondary,
    padding: 14, alignItems: 'center', position: 'relative',
  },
  planChipActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  planBadge: {
    position: 'absolute', top: -10,
    backgroundColor: colors.accent,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    fontSize: 8, color: '#fff', fontWeight: '800',
  },
  planPeriod: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  planPeriodActive: { color: colors.primary },
  planPrice: { color: '#fff', fontSize: 16, fontWeight: '800' },
  planPriceActive: { color: colors.primaryLight },
  vipCtaBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  vipCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  vipNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
