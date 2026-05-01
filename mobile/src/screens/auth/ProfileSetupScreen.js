import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';

const GENDERS = [
  { id: 'male', label: 'Male', emoji: '👨' },
  { id: 'female', label: 'Female', emoji: '👩' },
  { id: 'nonbinary', label: 'Non-binary', emoji: '🧑' },
];

const AGE_RANGE = Array.from({ length: 63 }, (_, i) => i + 18); // 18-80

export default function ProfileSetupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(22);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, updateUser } = useAuthStore();

  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter your display name');
      return;
    }
    if (!gender) {
      Alert.alert('Required', 'Please select your gender');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.setupProfile({ displayName, gender, age, bio });
      updateUser(res.data.user);
      navigation.replace('AgeVerification');
    } catch (err) {
      // Demo mode
      updateUser({ displayName, gender, age, bio, coins: 100, diamonds: 0, isVip: false });
      navigation.replace('AgeVerification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 3</Text>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>This is how others see you</Text>
        </View>

        {/* Avatar placeholder */}
        <TouchableOpacity style={styles.avatarContainer}>
          <LinearGradient colors={['#7C3AED', '#EC4899']} style={styles.avatarGradient}>
            <Text style={styles.avatarPlaceholder}>📷</Text>
          </LinearGradient>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>+</Text>
          </View>
        </TouchableOpacity>

        {/* Display name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="How should people call you?"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={20}
          />
          <Text style={styles.fieldHint}>{displayName.length}/20 characters</Text>
        </View>

        {/* Gender */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>I am</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.genderButton, gender === g.id && styles.genderButtonActive]}
                onPress={() => setGender(g.id)}
              >
                <Text style={styles.genderEmoji}>{g.emoji}</Text>
                <Text style={[styles.genderLabel, gender === g.id && styles.genderLabelActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Age */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Age: {age}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ageScroll}>
            {AGE_RANGE.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.ageChip, age === a && styles.ageChipActive]}
                onPress={() => setAge(a)}
              >
                <Text style={[styles.ageChipText, age === a && styles.ageChipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Bio (optional)</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell people something about you..."
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={setBio}
            maxLength={100}
            multiline
          />
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handleComplete} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Continue →</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 32 },
  step: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 15 },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: { fontSize: 40 },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarBadgeText: { color: '#fff', fontSize: 18, lineHeight: 22 },
  fieldContainer: { marginBottom: 24 },
  fieldLabel: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  fieldHint: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'right' },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  bioInput: { height: 90, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  genderEmoji: { fontSize: 28, marginBottom: 6 },
  genderLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  genderLabelActive: { color: colors.primary },
  ageScroll: { flexGrow: 0 },
  ageChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  ageChipActive: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: colors.primary,
  },
  ageChipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  ageChipTextActive: { color: colors.primary },
  ctaButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
