import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
];

// DEV MODE — any 6-digit OTP works. Replace with Firebase in production.
const DEV_MODE = true;
const DEV_OTP = '123456';

export default function PhoneAuthScreen({ navigation }) {
  const [step, setStep] = useState('phone');
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[1]);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setToken } = useAuthStore();

  const sendOTP = async () => {
    if (phone.length < 5) {
      Alert.alert('Invalid', 'Enter a valid phone number');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate network
    setLoading(false);
    setStep('otp');

    if (DEV_MODE) {
      Alert.alert(
        '📱 Dev Mode',
        `OTP sent! Use code: ${DEV_OTP}\n\n(Real SMS will work after Firebase setup)`,
        [{ text: 'OK' }]
      );
    }
  };

  const verifyOTP = async () => {
    if (otp.length < 4) {
      Alert.alert('Invalid', 'Enter the OTP');
      return;
    }

    if (DEV_MODE && otp !== DEV_OTP) {
      Alert.alert('Wrong OTP', `Use ${DEV_OTP} for now (dev mode)`);
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const fullPhone = `${selectedCode.code}${phone}`;
    const userId = 'user_' + Date.now();

    setToken('dev_token_' + userId);
    setUser({
      id: userId,
      phone: fullPhone,
      coins: 100,
      diamonds: 0,
      isVip: false,
      friends: 0,
    });

    setLoading(false);
    navigation.replace('ProfileSetup');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    const userId = 'google_' + Date.now();
    setToken('dev_token_' + userId);
    setUser({
      id: userId,
      displayName: 'Google User',
      email: 'user@gmail.com',
      coins: 100,
      diamonds: 0,
      isVip: false,
      friends: 0,
    });

    setLoading(false);
    navigation.replace('ProfileSetup');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.title}>
            {step === 'phone' ? 'Enter your number' : 'Verify OTP'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? "We'll send you a verification code"
              : `Code sent to ${selectedCode.code} ${phone}`}
          </Text>
          {step === 'otp' && DEV_MODE && (
            <View style={styles.devBanner}>
              <Text style={styles.devBannerText}>🛠 Dev mode — use code: {DEV_OTP}</Text>
            </View>
          )}
        </View>

        {/* Phone input */}
        {step === 'phone' && (
          <View style={styles.inputSection}>
            <TouchableOpacity
              style={styles.countryCode}
              onPress={() => setShowCodePicker(!showCodePicker)}
            >
              <Text style={styles.countryFlag}>{selectedCode.flag}</Text>
              <Text style={styles.countryCodeText}>{selectedCode.code}</Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={12}
            />
          </View>
        )}

        {/* Country picker */}
        {showCodePicker && step === 'phone' && (
          <View style={styles.codePicker}>
            {COUNTRY_CODES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[styles.codeItem, selectedCode.code === c.code && styles.codeItemActive]}
                onPress={() => { setSelectedCode(c); setShowCodePicker(false); }}
              >
                <Text style={styles.codeItemFlag}>{c.flag}</Text>
                <Text style={styles.codeItemName}>{c.name}</Text>
                <Text style={styles.codeItemCode}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* OTP input */}
        {step === 'otp' && (
          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="• • • • • •"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              textAlign="center"
              autoFocus
            />
            <TouchableOpacity onPress={() => setStep('phone')} style={styles.changeNumber}>
              <Text style={styles.changeNumberText}>Change number?</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          onPress={step === 'phone' ? sendOTP : verifyOTP}
          disabled={loading}
          style={styles.ctaWrapper}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>{step === 'phone' ? 'Send Code' : 'Verify & Continue'}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          style={styles.googleButton}
          activeOpacity={0.85}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
  },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  devBanner: {
    marginTop: 12,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  devBannerText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  inputSection: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden',
    marginBottom: 16,
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14,
    borderRightWidth: 1, borderRightColor: 'rgba(124,58,237,0.3)',
    gap: 6,
  },
  countryFlag: { fontSize: 22 },
  countryCodeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: 10 },
  phoneInput: {
    flex: 1, paddingVertical: 16, paddingHorizontal: 16,
    color: '#fff', fontSize: 16,
  },
  codePicker: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder,
    marginBottom: 16, overflow: 'hidden',
  },
  codeItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  codeItemActive: { backgroundColor: 'rgba(124,58,237,0.15)' },
  codeItemFlag: { fontSize: 22 },
  codeItemName: { flex: 1, color: '#fff', fontSize: 15 },
  codeItemCode: { color: colors.textSecondary, fontSize: 14 },
  otpContainer: { alignItems: 'center', marginBottom: 16 },
  otpInput: {
    width: '100%',
    borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 16, backgroundColor: colors.backgroundSecondary,
    padding: 18, color: '#fff', fontSize: 28, fontWeight: '700',
    letterSpacing: 12, marginBottom: 16,
  },
  changeNumber: { padding: 8 },
  changeNumberText: { color: colors.primary, fontSize: 14 },
  ctaWrapper: { marginBottom: 24 },
  ctaButton: {
    height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  dividerText: { color: colors.textMuted, fontSize: 13 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.cardBorder,
    borderRadius: 28, height: 56, gap: 12, marginBottom: 24,
    backgroundColor: colors.backgroundSecondary,
  },
  googleIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
  },
  googleIconText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  googleText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  terms: { textAlign: 'center', color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  termsLink: { color: colors.primary },
});
