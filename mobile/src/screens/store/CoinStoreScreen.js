import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { VIP_PERKS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useRegionalPricing } from '../../hooks/useRegionalPricing';
import { useIAP } from '../../hooks/useIAP';

const { width } = Dimensions.get('window');

export default function CoinStoreScreen({ navigation }) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('coins');
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const { packs, subPlans: plans, loading: pricingLoading } = useRegionalPricing();
  const currency = packs[0]?.currency || '$';
  const { buyCoins, buyVIP, purchasing, connected } = useIAP();

  const handlePurchase = (pack) => {
    if (!connected) {
      return;
    }
    buyCoins(pack.id);
  };

  const handleVIPPurchase = (plan) => {
    if (!connected) {
      return;
    }
    buyVIP(plan.id);
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
          <Text style={styles.balanceText}>🪙 {user?.coins || 0}</Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {pricingLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'coins' ? (
          <>
            {/* Loyalty banner */}
            <View style={styles.loyaltyBanner}>
              <Text style={styles.loyaltyTitle}>🎁 Loyalty Rewards</Text>
              <Text style={styles.loyaltySub}>Buy 3x in a row → 10% extra coins</Text>
              <View style={styles.loyaltyBar}>
                <View style={[styles.loyaltyFill, { width: '33%' }]} />
              </View>
              <Text style={styles.loyaltyHint}>1/3 purchases towards bonus</Text>
            </View>

            {/* Coin packs */}
            <Text style={styles.sectionTitle}>Choose a pack</Text>
            <View style={styles.packsGrid}>
              {packs.map((pack) => (
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
                    <Text style={styles.packCoins}>🪙 {pack.coins.toLocaleString()}</Text>
                    <Text style={styles.packLabel}>{pack.label}</Text>
                    <View style={styles.packBuyBtn}>
                      <LinearGradient
                        colors={['#7C3AED', '#EC4899']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.packBuyBtnGrad}
                      >
                        {purchasing
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.packBuyBtnText}>{pack.currency || currency}{pack.price}</Text>
                        }
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Milestones */}
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneTitle}>🏆 Milestone Bonuses</Text>
              <Text style={styles.milestoneItem}>• Buy 3,000 coins total → 300 FREE</Text>
              <Text style={styles.milestoneItem}>• Buy 10,000 coins total → 1,500 FREE</Text>
              <Text style={styles.milestoneItem}>• Buy 3x this week → 10% extra</Text>
            </View>
          </>
        ) : (
          <>
            {/* VIP perks */}
            <View style={styles.perksGrid}>
              {VIP_PERKS.map((perk, i) => (
                <View key={i} style={styles.perkCard}>
                  <Text style={styles.perkIcon}>{perk.icon}</Text>
                  <Text style={styles.perkText}>{perk.text}</Text>
                </View>
              ))}
            </View>

            {/* Plan selector */}
            <Text style={styles.sectionTitle}>Choose your plan</Text>
            <View style={styles.planRow}>
              {Object.entries(plans).map(([key, plan]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.planCard, selectedPlan === key && styles.planCardActive]}
                  onPress={() => setSelectedPlan(key)}
                >
                  {plan.badge && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <Text style={[styles.planPeriod, selectedPlan === key && styles.planPeriodActive]}>
                    {plan.label?.toUpperCase()}
                  </Text>
                  <Text style={[styles.planPrice, selectedPlan === key && styles.planPriceActive]}>
                    {plan.currency || currency}{plan.price}
                  </Text>
                  <Text style={styles.planSub}>/{plan.period}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subscribe CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={purchasing}
              onPress={() => handleVIPPurchase(plans[selectedPlan])}
              style={styles.vipCta}
            >
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.vipCtaGrad}
              >
                {purchasing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.vipCtaText}>
                      {`👑 Get VIP — ${plans[selectedPlan]?.currency || currency}${plans[selectedPlan]?.price}/${plans[selectedPlan]?.period}`}
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.vipNote}>Cancel anytime · No hidden fees</Text>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  balanceBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.primary,
  },
  balanceText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  loyaltyBanner: {
    backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', marginBottom: 20,
  },
  loyaltyTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  loyaltySub: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
  loyaltyBar: { height: 6, backgroundColor: colors.backgroundSecondary, borderRadius: 3, marginBottom: 4 },
  loyaltyFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  loyaltyHint: { color: colors.textMuted, fontSize: 11 },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  packsGrid: { gap: 10, marginBottom: 20 },
  packCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder,
    flexDirection: 'row', alignItems: 'center', position: 'relative',
  },
  packCardFeatured: { borderColor: colors.primary },
  packBadge: {
    position: 'absolute', top: -8, right: 12,
    backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  packBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  packCoins: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1 },
  packLabel: { color: colors.textMuted, fontSize: 12, marginRight: 12 },
  packBuyBtn: { borderRadius: 20, overflow: 'hidden' },
  packBuyBtnGrad: { paddingHorizontal: 16, paddingVertical: 8 },
  packBuyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  milestoneCard: {
    backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  milestoneTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  milestoneItem: { color: colors.textSecondary, fontSize: 13, marginBottom: 6, lineHeight: 20 },
  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  perkCard: {
    width: (width - 48) / 2, backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  perkIcon: { fontSize: 24, marginBottom: 6 },
  perkText: { color: '#fff', fontSize: 12, lineHeight: 17 },
  planRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  planCard: {
    flex: 1, borderRadius: 16, borderWidth: 1.5, borderColor: colors.cardBorder,
    backgroundColor: colors.backgroundSecondary, padding: 14, alignItems: 'center', position: 'relative',
  },
  planCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  planBadge: {
    position: 'absolute', top: -10, backgroundColor: colors.accent,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  planBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  planPeriod: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  planPeriodActive: { color: colors.primary },
  planPrice: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  planPriceActive: { color: colors.primaryLight },
  planSub: { color: colors.textMuted, fontSize: 10 },
  vipCta: { borderRadius: 28, overflow: 'hidden', marginBottom: 10 },
  vipCtaGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
  vipCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  vipNote: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
