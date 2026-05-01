import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

export default function AgeVerificationScreen({ navigation }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <Text style={styles.emoji}>🔞</Text>
        <Text style={styles.title}>Age Verification</Text>
        <Text style={styles.subtitle}>
          ConnectNow is for users{'\n'}18 years and older only.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            This app contains live video content from real users. By continuing, you confirm you are at least 18 years old.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkbox, confirmed && styles.checkboxActive]}
          onPress={() => setConfirmed(!confirmed)}
        >
          <Text style={styles.checkmark}>{confirmed ? '✓' : ' '}</Text>
          <Text style={styles.checkboxLabel}>I confirm I am 18+ years old</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.replace('MainTabs')}
          disabled={!confirmed}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={confirmed ? ['#7C3AED', '#EC4899'] : ['#333', '#333']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Enter ConnectNow →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    width: '100%',
  },
  cardText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.backgroundSecondary,
    width: '100%',
  },
  checkboxActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.1)' },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 22,
    fontSize: 14,
  },
  checkboxLabel: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  ctaButton: {
    width: 300,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
