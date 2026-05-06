import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';
import { INTERESTS } from '../../constants';

const CLOUDINARY_CLOUD_NAME = 'daezgfr8k';
const CLOUDINARY_UPLOAD_PRESET = 'connectnow_profiles';

const GENDERS = [
  { id: 'male', label: 'Male', emoji: '👨' },
  { id: 'female', label: 'Female', emoji: '👩' },
  { id: 'nonbinary', label: 'Non-binary', emoji: '🧑' },
];

async function uploadToCloudinary(uri) {
  const filename = uri.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri, name: filename, type });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'connectnow/profiles');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }

  const data = await res.json();
  return data.secure_url;
}

// Calculate age from DOB string (YYYY-MM-DD or DD/MM/YYYY)
function calculateAge(dob) {
  if (!dob) return null;
  // Try DD/MM/YYYY first
  let date;
  if (dob.includes('/')) {
    const [d, m, y] = dob.split('/');
    date = new Date(`${y}-${m}-${d}`);
  } else {
    date = new Date(dob);
  }
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

export default function ProfileSetupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState(null);
  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const { updateUser } = useAuthStore();

  const handleDobChange = (text) => {
    // Auto-format as DD/MM/YYYY
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 3 && cleaned.length <= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    } else if (cleaned.length >= 5) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }
    setDob(formatted);
    setDobError('');
  };

  const validateDob = () => {
    const age = calculateAge(dob);
    if (!dob || dob.length < 8) {
      setDobError('Please enter a valid date of birth (DD/MM/YYYY)');
      return false;
    }
    if (age === null) {
      setDobError('Invalid date. Use DD/MM/YYYY format');
      return false;
    }
    if (age < 18) {
      setDobError('You must be 18 or older to use ConnectNow');
      return false;
    }
    if (age > 100) {
      setDobError('Please enter a valid date of birth');
      return false;
    }
    return true;
  };

  const toggleInterest = (id) => {
    setSelectedInterests(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 5) {
        Alert.alert('Max 5 interests', 'Remove one before adding another.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setUploadingPhoto(true);
      try {
        const url = await uploadToCloudinary(uri);
        setPhotoUrl(url);
      } catch (err) {
        console.error('Photo upload error:', err);
        Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
        setPhotoUri(null);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter your display name');
      return;
    }
    if (!gender) {
      Alert.alert('Required', 'Please select your gender');
      return;
    }
    if (!validateDob()) {
      return;
    }
    if (selectedInterests.length < 3) {
      Alert.alert('Pick your interests', 'Select at least 3 interests so we can find better matches!');
      return;
    }
    const age = calculateAge(dob);
    setLoading(true);
    try {
      const res = await authAPI.setupProfile({
        displayName,
        gender,
        age,
        dob,
        bio,
        photoUrl: photoUrl || null,
        interests: selectedInterests,
      });
      updateUser(res.data.user);
    } catch (err) {
      // Backend may not be configured yet — update local state
      updateUser({ displayName, gender, age, dob, bio, photoUrl, interests: selectedInterests, coins: 100, diamonds: 0, isVip: false });
    } finally {
      setLoading(false);
      navigation.replace('AgeVerification');
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

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickPhoto} disabled={uploadingPhoto}>
          {photoUri ? (
            <View style={styles.avatarImageWrapper}>
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <LinearGradient colors={['#7C3AED', '#EC4899']} style={styles.avatarGradient}>
              <Text style={styles.avatarPlaceholder}>📷</Text>
            </LinearGradient>
          )}
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>{uploadingPhoto ? '⏳' : '+'}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to add profile photo</Text>

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

        {/* Date of Birth */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <TextInput
            style={[styles.input, dobError ? styles.inputError : null]}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            value={dob}
            onChangeText={handleDobChange}
            keyboardType="numeric"
            maxLength={10}
          />
          {dobError ? (
            <Text style={styles.errorText}>{dobError}</Text>
          ) : dob.length === 10 && calculateAge(dob) !== null ? (
            <Text style={styles.ageHint}>Age: {calculateAge(dob)} years old</Text>
          ) : null}
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

        {/* Interests */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Your Interests</Text>
          <Text style={styles.fieldHint2}>Pick 3–5 to find better matches</Text>
          <View style={styles.interestsGrid}>
            {INTERESTS.map((item) => {
              const active = selectedInterests.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.interestChip, active && styles.interestChipActive]}
                  onPress={() => toggleInterest(item.id)}
                >
                  <Text style={styles.interestEmoji}>{item.emoji}</Text>
                  <Text style={[styles.interestLabel, active && styles.interestLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.interestCount}>{selectedInterests.length}/5 selected</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading || uploadingPhoto}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, uploadingPhoto && { opacity: 0.6 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>
                  {uploadingPhoto ? 'Uploading photo...' : 'Continue →'}
                </Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 24 },
  step: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { color: colors.textSecondary, fontSize: 15 },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  avatarImageWrapper: {
    width: 100, height: 100, borderRadius: 50, overflow: 'hidden',
  },
  avatarImage: {
    width: 100, height: 100, borderRadius: 50,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradient: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholder: { fontSize: 40 },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  avatarBadgeText: { color: '#fff', fontSize: 18, lineHeight: 22 },
  photoHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 24 },
  fieldContainer: { marginBottom: 24 },
  fieldLabel: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  fieldHint: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'right' },
  inputError: { borderColor: '#FF4C4C' },
  errorText: { color: '#FF4C4C', fontSize: 12, marginTop: 6 },
  ageHint: { color: colors.primary, fontSize: 12, marginTop: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    padding: 16, color: '#fff', fontSize: 15,
  },
  bioInput: { height: 90, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderButton: {
    flex: 1,
    borderWidth: 1.5, borderColor: colors.cardBorder,
    borderRadius: 14, padding: 16, alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  genderEmoji: { fontSize: 28, marginBottom: 6 },
  genderLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  genderLabelActive: { color: colors.primary },
  ctaButton: {
    height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  fieldHint2: { color: colors.textMuted, fontSize: 12, marginBottom: 12 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 4,
  },
  interestChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124,58,237,0.18)',
  },
  interestEmoji: { fontSize: 16, marginRight: 6 },
  interestLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  interestLabelActive: { color: colors.primary },
  interestCount: { color: colors.textMuted, fontSize: 12, marginTop: 8, textAlign: 'right' },
});
