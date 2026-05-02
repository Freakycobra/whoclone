import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Alert,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useBonusStore } from '../store/bonusStore';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

const DAY_REWARDS = [50, 100, 150, 200, 250, 300, 500];

const DAY_ICONS = ['🌟', '💫', '⚡', '🔥', '💎', '👑', '🎰'];

const STREAK_FREEZE_COST = 99;

export default function DailyBonusModal({ visible, onClose }) {
  const { currentDay, claimBonus, isClaimedToday, streak, streakFreezeCount, buyStreakFreeze } = useBonusStore();
  const { addCoins, spendCoins } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;
  const [claimed, setClaimed] = React.useState(false);
  const [claimedCoins, setClaimedCoins] = React.useState(0);

  const alreadyClaimed = isClaimedToday();

  useEffect(() => {
    if (visible) {
      setClaimed(alreadyClaimed);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClaim = async () => {
    if (claimed) return;
    const reward = await claimBonus();
    if (reward > 0) {
      addCoins(reward);
      setClaimedCoins(reward);
      setClaimed(true);
      // Coin burst animation
      Animated.sequence([
        Animated.spring(coinAnim, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
        Animated.timing(coinAnim, { toValue: 0, duration: 300, delay: 1200, useNativeDriver: true }),
      ]).start();
    }
  };

  // Which day index is active (0-based)
  // currentDay is the NEXT day to claim, so active = currentDay - 1
  // But if already claimed today, it's currentDay - 1 (just claimed), next is currentDay
  const activeDayIndex = alreadyClaimed || claimed
    ? (currentDay === 1 ? 6 : currentDay - 2) // just claimed = previous day
    : currentDay - 1;

  const coinBurstScale = coinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] });
  const coinBurstOpacity = coinAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={styles.header}
          >
            <View style={styles.headerGlow} />
            {streak > 1 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak} day streak!</Text>
              </View>
            )}
            <Text style={styles.headerEmoji}>🎁</Text>
            <Text style={styles.headerTitle}>Daily Login Reward</Text>
            <Text style={styles.headerSub}>Log in every day for bigger rewards!</Text>
          </LinearGradient>

          {/* Day grid */}
          <View style={styles.daysGrid}>
            {DAY_REWARDS.map((coins, idx) => {
              const dayNum = idx + 1;
              const isPast = idx < activeDayIndex || (claimed && idx === activeDayIndex);
              const isActive = !claimed && idx === activeDayIndex;
              const isClaimedDay = alreadyClaimed && idx === activeDayIndex;
              const isFuture = idx > activeDayIndex && !(claimed && idx <= activeDayIndex);

              return (
                <View
                  key={idx}
                  style={[
                    styles.dayCard,
                    isPast && styles.dayCardPast,
                    isActive && styles.dayCardActive,
                    isClaimedDay && styles.dayCardClaimed,
                  ]}
                >
                  {(isPast || isClaimedDay) && (
                    <View style={styles.dayCheckBadge}>
                      <Text style={styles.dayCheck}>✓</Text>
                    </View>
                  )}
                  {isActive && (
                    <LinearGradient
                      colors={['#7C3AED', '#EC4899']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <Text style={[styles.dayIcon, isFuture && styles.dayIconFaded]}>{DAY_ICONS[idx]}</Text>
                  <Text style={[styles.dayLabel, isActive && styles.dayLabelActive, isFuture && styles.dayLabelFaded]}>
                    Day {dayNum}
                  </Text>
                  <Text style={[styles.dayCoins, isActive && styles.dayCoinsBright, isFuture && styles.dayCoinsFaded]}>
                    {coins >= 1000 ? `${coins / 1000}k` : coins}🪙
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Coin burst animation */}
          <Animated.View
            style={[
              styles.coinBurst,
              {
                opacity: coinBurstOpacity,
                transform: [{ scale: coinBurstScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.coinBurstText}>+{claimedCoins} 🪙</Text>
          </Animated.View>

          {/* Bottom area */}
          <View style={styles.footer}>
            {claimed || alreadyClaimed ? (
              <View style={styles.claimedBox}>
                <Text style={styles.claimedEmoji}>✅</Text>
                <Text style={styles.claimedText}>
                  {claimedCoins > 0
                    ? `+${claimedCoins} coins added to your wallet!`
                    : "You've already claimed today's bonus!"}
                </Text>
                <Text style={styles.claimedSub}>Come back tomorrow for Day {currentDay}</Text>
              </View>
            ) : (
              <View style={styles.claimSection}>
                <View style={styles.todayReward}>
                  <Text style={styles.todayLabel}>Today's Reward</Text>
                  <Text style={styles.todayAmount}>{DAY_REWARDS[activeDayIndex]} 🪙</Text>
                </View>
                <TouchableOpacity onPress={handleClaim} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#7C3AED', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.claimBtn}
                  >
                    <Text style={styles.claimBtnText}>✨ Claim Reward</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Streak freeze purchase */}
            {streak > 2 && (
              <TouchableOpacity
                style={styles.freezeBtn}
                onPress={async () => {
                  const { user } = useAuthStore.getState();
                  if ((user?.coins || 0) < STREAK_FREEZE_COST) {
                    Alert.alert('Not enough coins', `Streak Freeze costs ${STREAK_FREEZE_COST} coins.`);
                    return;
                  }
                  await spendCoins(STREAK_FREEZE_COST);
                  await buyStreakFreeze();
                  Alert.alert('❄️ Streak Freeze!', `You now have ${streakFreezeCount + 1} freeze(s). Your streak is protected for 1 missed day.`);
                }}
              >
                <Text style={styles.freezeBtnText}>
                  ❄️ Freeze Streak ({STREAK_FREEZE_COST}🪙) {streakFreezeCount > 0 ? `· ${streakFreezeCount} active` : ''}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
              <Text style={styles.skipText}>{claimed || alreadyClaimed ? 'Continue' : 'Skip for now'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const CARD_WIDTH = width * 0.9;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#13131A',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    width: 200,
    height: 100,
    borderRadius: 100,
    backgroundColor: 'rgba(124,58,237,0.25)',
  },
  headerEmoji: { fontSize: 44, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    justifyContent: 'center',
  },
  dayCard: {
    width: (CARD_WIDTH - 24 - 6 * 8) / 7,
    aspectRatio: 0.75,
    borderRadius: 12,
    backgroundColor: '#1C1C27',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 2,
  },
  dayCardPast: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.3)',
    opacity: 0.75,
  },
  dayCardActive: {
    borderColor: '#7C3AED',
    borderWidth: 2,
  },
  dayCardClaimed: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderColor: 'rgba(16,185,129,0.5)',
  },
  dayCheckBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dayCheck: { color: '#fff', fontSize: 8, fontWeight: '900' },
  dayIcon: { fontSize: 16 },
  dayIconFaded: { opacity: 0.4 },
  dayLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700' },
  dayLabelActive: { color: '#fff', fontWeight: '900' },
  dayLabelFaded: { color: colors.textMuted, opacity: 0.5 },
  dayCoins: { color: colors.gold, fontSize: 8, fontWeight: '700' },
  dayCoinsBright: { color: '#fff', fontSize: 9, fontWeight: '900' },
  dayCoinsFaded: { opacity: 0.4 },

  coinBurst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -20 }],
    backgroundColor: 'rgba(245,158,11,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    zIndex: 99,
  },
  coinBurstText: { color: '#000', fontSize: 20, fontWeight: '900' },

  footer: { padding: 16, paddingTop: 4 },
  claimSection: { gap: 12, marginBottom: 4 },
  todayReward: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  todayLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  todayAmount: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  claimBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  claimBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  claimedBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    gap: 6,
  },
  claimedEmoji: { fontSize: 32 },
  claimedText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  claimedSub: { color: colors.textSecondary, fontSize: 12 },

  skipBtn: { padding: 12, alignItems: 'center' },
  skipText: { color: colors.textMuted, fontSize: 14 },

  streakBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: 'center',
  },
  streakText: { color: '#F59E0B', fontSize: 15, fontWeight: '800' },

  freezeBtn: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.35)',
    borderRadius: 12,
    padding: 11,
    alignItems: 'center',
    marginBottom: 4,
  },
  freezeBtnText: { color: '#93C5FD', fontSize: 13, fontWeight: '700' },
});
