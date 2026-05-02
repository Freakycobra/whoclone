import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { VIP_PERKS } from '../../constants';
import { useRegionalPricing } from '../../hooks/useRegionalPricing';

const { width } = Dimensions.get('window');

export default function PremiumScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const { subPlans: plans, loading: pricingLoading } = useRegionalPricing();
  const currency = plans?.monthly?.currency || '$';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0a2e', '#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.heroTitle}>Go VIP Today</Text>
          <Text style={styles.heroSub}>
            The fastest path to better matches, zero ads, and full control.
          </Text>
        </View>

        {/* Perks grid */}
        <View style={styles.perksGrid}>
          {VIP_PERKS.map((perk, i) => (
            <View key={i} style={styles.perkCard}>
              <Text style={styles.perkCardIcon}>{perk.icon}</Text>
              <Text style={styles.perkCardText}>{perk.text}</Text>
            </View>
          ))}
        </View>

        {/* Comparison */}
        <View style={styles.compCard}>
          <View style={styles.compRow}>
            <Text style={styles.compLabel}>Feature</Text>
            <Text style={styles.compFree}>Free</Text>
            <Text style={styles.compVip}>VIP 👑</Text>
          </View>
          {[
            ['Daily matches', '5/day', 'Unlimited'],
            ['Gender filter', '❌', '✅'],
            ['Country filter', '❌', '✅'],
            ['Ads', 'Yes', 'None'],
            ['Match speed', '1x', '3x'],
            ['Profile boost', '❌', '✅'],
            ['Daily coins', '❌', '+50/day'],
          ].map(([feature, free, vip]) => (
            <View key={feature} style={styles.compRow}>
              <Text style={styles.compLabel}>{feature}</Text>
              <Text style={styles.compFreeVal}>{free}</Text>
              <Text style={styles.compVipVal}>{vip}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <Text style={styles.planLabel}>Choose your plan</Text>
        {pricingLoading ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 20 }}>Loading prices...</Text>
        ) : (
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
                  {key.toUpperCase()}
                </Text>
                <Text style={[styles.planPrice, selectedPlan === key && styles.planPriceActive]}>
                  {plan.currency || currency}{plan.price}
                </Text>
                <Text style={styles.planSub}>per {plan.period}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Social proof */}
        <View style={styles.proofBanner}>
          <Text style={styles.proofText}>⭐ 4.8 · 12,000+ reviews · "Best upgrade I made"</Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient
              colors={['#7C3AED', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaBtnText}>
                {pricingLoading
                  ? '👑 Get VIP'
                  : `👑 Get VIP — ${plans[selectedPlan]?.currency || currency}${plans[selectedPlan]?.price}/${plans[selectedPlan]?.period}`
                }
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>Cancel anytime · Renews automatically · No hidden fees</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  closeBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 32, paddingHorizontal: 28 },
  crownEmoji: { fontSize: 72, marginBottom: 16 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
  heroSub: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  perkCard: {
    width: (width - 48) / 2,
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
  },
  perkCardIcon: { fontSize: 28, marginBottom: 8 },
  perkCardText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  compCard: {
    marginHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20, overflow: 'hidden', marginBottom: 24,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  compRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder, alignItems: 'center',
  },
  compLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  compFree: { width: 60, color: colors.textMuted, fontSize: 13, textAlign: 'center', fontWeight: '700' },
  compVip: { width: 60, color: colors.primaryLight, fontSize: 13, textAlign: 'center', fontWeight: '700' },
  compFreeVal: { width: 60, color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  compVipVal: { width: 60, color: colors.success, fontSize: 13, textAlign: 'center', fontWeight: '600' },
  planLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginLeft: 16, marginBottom: 10 },
  planRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  planCard: {
    flex: 1, borderRadius: 16, borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.backgroundSecondary,
    padding: 14, alignItems: 'center', position: 'relative',
  },
  planCardActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  planBadge: {
    position: 'absolute', top: -10,
    backgroundColor: colors.accent, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  planBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  planPeriod: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  planPeriodActive: { color: colors.primary },
  planPrice: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  planPriceActive: { color: colors.primaryLight },
  planSub: { color: colors.textMuted, fontSize: 10 },
  proofBanner: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  proofText: { color: colors.gold, fontSize: 13, textAlign: 'center' },
  ctaSection: { paddingHorizontal: 16 },
  ctaBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctaNote: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
