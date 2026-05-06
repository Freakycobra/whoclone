import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image, Modal,
  Platform, PermissionsAndroid,
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

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return (await res.json()).secure_url;
}

// Returns age as integer, or null if inputs invalid
function calculateAge(day, month, year) {
  const d = parseInt(day, 10);
  const m = MONTHS.indexOf(month);
  const y = parseInt(year, 10);
  if (!day || !month || !year) return null;
  if (isNaN(d) || isNaN(y) || m === -1) return null;
  if (d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) return null;
  const date = new Date(y, m, d);
  if (date.getMonth() !== m) return null; // e.g. Feb 30 overflow
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const dm = today.getMonth() - date.getMonth();
  if (dm < 0 || (dm === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

// ─── Month Picker Modal ───────────────────────────────────────────────────────
function MonthPickerModal({ visible, selected, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={mp.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={mp.sheet}>
          <Text style={mp.title}>Select Month</Text>
          <View style={mp.grid}>
            {MONTHS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[mp.chip, selected === m && mp.chipActive]}
                onPress={() => { onSelect(m); onClose(); }}
              >
                <Text style={[mp.chipText, selected === m && mp.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const mp = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  sheet: {
    width: '80%', backgroundColor: '#1A1A26',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: {
    width: 64, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderColor: '#7C3AED',
  },
  chipText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileSetupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState(null);

  // DOB split into 3 parts
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [dobError, setDobError] = useState('');
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();

  const liveAge = calculateAge(dobDay, dobMonth, dobYear);
  const dobComplete = dobDay.length >= 1 && dobMonth && dobYear.length === 4;

  const validateDob = () => {
    if (!dobDay || !dobMonth || dobYear.length < 4) {
      setDobError('Please complete your date of birth');
      return false;
    }
    if (liveAge === null) {
      setDobError('Invalid date — check day and year');
      return false;
    }
    if (liveAge > 100) {
      setDobError('Please enter a valid date of birth');
      return false;
    }
    return true;
  };

  const launchWithUri = async (uri) => {
    setPhotoUri(uri);
    setUploadingPhoto(true);
    try {
      setPhotoUrl(await uploadToCloudinary(uri));
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
      setPhotoUri(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'ConnectNow needs access to your camera to take a profile photo.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestLibraryPermission = async () => {
    if (Platform.OS === 'android') {
      // Android 13+ uses READ_MEDIA_IMAGES, older uses READ_EXTERNAL_STORAGE
      const permission = parseInt(Platform.Version, 10) >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      const granted = await PermissionsAndroid.request(permission, {
        title: 'Photo Library Permission',
        message: 'ConnectNow needs access to your photos to set your profile picture.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const openCamera = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert(
        'Camera permission needed',
        'Go to Settings > Apps > ConnectNow > Permissions and allow Camera access.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      await launchWithUri(result.assets[0].uri);
    }
  };

  const openLibrary = async () => {
    const granted = await requestLibraryPermission();
    if (!granted) {
      Alert.alert(
        'Photo access needed',
        'Go to Settings > Apps > ConnectNow > Permissions and allow Photos access.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      await launchWithUri(result.assets[0].uri);
    }
  };

  const pickPhoto = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how to add your photo',
      [
        { text: 'Take a Photo', onPress: openCamera },
        { text: 'Choose from Library', onPress: openLibrary },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleComplete = async () => {
    if (!displayName.trim()) { Alert.alert('Required', 'Please enter your display name'); return; }
    if (!gender) { Alert.alert('Required', 'Please select your gender'); return; }
    if (!validateDob()) return;

    // Under-18 gate
    if (liveAge < 18) {
      navigation.replace('UnderAge');
      return;
    }

    const age = liveAge;
    const dob = `${dobDay.padStart(2, '0')}/${dobMonth}/${dobYear}`;
    setLoading(true);
    try {
      const res = await authAPI.setupProfile({
        displayName, gender, age, dob, bio,
        photoUrl: photoUrl || null,
      });
      updateUser(res.data.user);
    } catch {
      updateUser({ displayName, gender, age, dob, bio, photoUrl, coins: 100, diamonds: 0, isVip: false });
    } finally {
      setLoading(false);
      navigation.replace('AgeVerification');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      <MonthPickerModal
        visible={monthPickerOpen}
        selected={dobMonth}
        onSelect={setDobMonth}
        onClose={() => setMonthPickerOpen(false)}
      />

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

        {/* Display Name */}
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
          <View style={styles.dobRow}>
            {/* Day */}
            <TextInput
              style={[styles.dobInput, styles.dobDay, dobError && styles.inputError]}
              placeholder="DD"
              placeholderTextColor={colors.textMuted}
              value={dobDay}
              onChangeText={(t) => { setDobDay(t.replace(/[^0-9]/g, '').slice(0, 2)); setDobError(''); }}
              keyboardType="number-pad"
              maxLength={2}
            />

            {/* Month dropdown trigger */}
            <TouchableOpacity
              style={[styles.dobInput, styles.dobMonth, dobError && styles.inputError]}
              onPress={() => setMonthPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={dobMonth ? styles.dobMonthText : styles.dobMonthPlaceholder}>
                {dobMonth || 'MMM'}
              </Text>
              <Text style={styles.dobDropIcon}>▾</Text>
            </TouchableOpacity>

            {/* Year */}
            <TextInput
              style={[styles.dobInput, styles.dobYear, dobError && styles.inputError]}
              placeholder="YYYY"
              placeholderTextColor={colors.textMuted}
              value={dobYear}
              onChangeText={(t) => { setDobYear(t.replace(/[^0-9]/g, '').slice(0, 4)); setDobError(''); }}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {dobError ? (
            <Text style={styles.errorText}>{dobError}</Text>
          ) : dobComplete && liveAge !== null ? (
            <Text style={[styles.ageHint, liveAge < 18 && styles.ageHintWarn]}>
              {liveAge < 18
                ? `Age: ${liveAge} — you must be 18+ to continue`
                : `Age: ${liveAge} years old ✓`}
            </Text>
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

        {/* CTA */}
        <TouchableOpacity onPress={handleComplete} disabled={loading || uploadingPhoto} activeOpacity={0.85}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, uploadingPhoto && { opacity: 0.6 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>{uploadingPhoto ? 'Uploading photo...' : 'Continue →'}</Text>
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
  avatarContainer: { alignSelf: 'center', marginBottom: 8, position: 'relative' },
  avatarImageWrapper: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarGradient: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
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
  ageHintWarn: { color: '#FF9500' },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    padding: 16, color: '#fff', fontSize: 15,
  },
  bioInput: { height: 90, textAlignVertical: 'top' },

  // DOB row
  dobRow: { flexDirection: 'row', gap: 10 },
  dobInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    height: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  dobDay: { width: 62, textAlign: 'center', color: '#fff', fontSize: 16 },
  dobMonth: { flex: 1, flexDirection: 'row', paddingHorizontal: 12 },
  dobMonthText: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  dobMonthPlaceholder: { color: colors.textMuted, fontSize: 15, flex: 1 },
  dobDropIcon: { color: colors.textMuted, fontSize: 14 },
  dobYear: { width: 80, textAlign: 'center', color: '#fff', fontSize: 16 },

  // Gender
  genderRow: { flexDirection: 'row', gap: 12 },
  genderButton: {
    flex: 1, borderWidth: 1.5, borderColor: colors.cardBorder,
    borderRadius: 14, padding: 16, alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  genderButtonActive: { borderColor: colors.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  genderEmoji: { fontSize: 28, marginBottom: 6 },
  genderLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  genderLabelActive: { color: colors.primary },

  // CTA
  ctaButton: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
