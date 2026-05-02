import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';

const CLOUDINARY_CLOUD_NAME = 'daezgfr8k';
const CLOUDINARY_UPLOAD_PRESET = 'connectnow_profiles';

const GENDERS = [
  { id: 'male', label: 'Male', emoji: '👨' },
  { id: 'female', label: 'Female', emoji: '👩' },
  { id: 'nonbinary', label: 'Non-binary', emoji: '🧑' },
];

const AGE_RANGE = Array.from({ length: 63 }, (_, i) => i + 18);

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

export default function ProfileSetupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(22);
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();

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
    setLoading(true);
    try {
      const res = await authAPI.setupProfile({
        displayName,
        gender,
        age,
        bio,
        photoUrl: photoUrl || null,
      });
      updateUser(res.data.user);
    } catch (err) {
      // Backend may not be configured yet — update local state
      updateUser({ displayName, gender, age, bio, photoUrl, coins: 100, diamonds: 0, isVip: false });
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
  ageScroll: { flexGrow: 0 },
  ageChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1, borderColor: colors.cardBorder, marginRight: 8,
  },
  ageChipActive: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: colors.primary,
  },
  ageChipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  ageChipTextActive: { color: colors.primary },
  ctaButton: {
    height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
