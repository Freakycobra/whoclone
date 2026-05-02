import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useFollowStore } from '../../store/followStore';
import { INTERESTS } from '../../constants';

const CLOUDINARY_CLOUD_NAME = 'daezgfr8k';
const CLOUDINARY_UPLOAD_PRESET = 'connectnow_profiles';

async function uploadToCloudinary(uri) {
  const filename = uri.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  const formData = new FormData();
  formData.append('file', { uri, name: filename, type });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.secure_url;
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuthStore();
  const { following, followers } = useFollowStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const interestItems = (user?.interests || [])
    .map(id => INTERESTS.find(i => i.id === id))
    .filter(Boolean);

  const genderEmoji = { male: '👨', female: '👩', nonbinary: '🧑' };

  const handleEditPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setUploadingPhoto(true);
      try {
        const url = await uploadToCloudinary(result.assets[0].uri);
        updateUser({ photoUrl: url });
        Alert.alert('Done!', 'Profile photo updated.');
      } catch (e) {
        Alert.alert('Error', 'Could not upload photo. Try again.');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    updateUser({ displayName: editName.trim(), bio: editBio.trim() });
    setShowEditModal(false);
    Alert.alert('Saved!', 'Profile updated.');
  };

  const handleMenuPress = (id) => {
    switch (id) {
      case 'friends': Alert.alert('Friends', 'Friends feature coming soon!'); break;
      case 'history': Alert.alert('Chat History', 'Chat history feature coming soon!'); break;
      case 'earnings': Alert.alert('Diamond Earnings', `You have ${user?.diamonds || 0} diamonds.\n\nDiamond payouts will be available soon.`); break;
      case 'settings': Alert.alert('Settings', 'Choose an option:', [
        { text: 'Change Language', onPress: () => Alert.alert('Language', 'Multi-language support coming soon!') },
        { text: 'Notifications', onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!') },
        { text: 'Cancel', style: 'cancel' },
      ]); break;
      case 'notifications': Alert.alert('Notifications', 'No new notifications.'); break;
      case 'language': Alert.alert('Language', 'Multi-language support coming soon!'); break;
      case 'privacy': Alert.alert('Privacy & Safety', [
        'Your data is secure.',
        'We never share your personal info.',
        'You can delete your account at any time.',
      ].join('\n\n')); break;
      case 'help': Alert.alert('Help & Support', 'Contact us at:\nsupport@connectnow.app\n\nResponse time: 24-48 hours.'); break;
      default: break;
    }
  };

  const MENU_ITEMS = [
    { id: 'friends', icon: '👥', label: 'Friends', badge: null },
    { id: 'history', icon: '📋', label: 'Chat History', badge: null },
    { id: 'earnings', icon: '💎', label: 'Diamond Earnings', badge: user?.diamonds > 0 ? `${user.diamonds}` : 'NEW' },
    { id: 'settings', icon: '⚙️', label: 'Settings', badge: null },
    { id: 'notifications', icon: '🔔', label: 'Notifications', badge: null },
    { id: 'language', icon: '🌍', label: 'Language', badge: null },
    { id: 'privacy', icon: '🔒', label: 'Privacy & Safety', badge: null },
    { id: 'help', icon: '❓', label: 'Help & Support', badge: null },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <LinearGradient colors={['#1a0a2e', '#13131A']} style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleEditPhoto} disabled={uploadingPhoto}>
            {user?.photoUrl ? (
              <View style={styles.avatarImageWrapper}>
                <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
                {uploadingPhoto && (
                  <View style={styles.uploadOverlay}><ActivityIndicator color="#fff" /></View>
                )}
              </View>
            ) : (
              <LinearGradient colors={['#7C3AED', '#EC4899']} style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{genderEmoji[user?.gender] || '😊'}</Text>
              </LinearGradient>
            )}
            <View style={styles.editPhotoBadge}>
              <Text style={styles.editPhotoBadgeText}>{uploadingPhoto ? '⏳' : '📷'}</Text>
            </View>
            {user?.isVip && (
              <View style={styles.vipBadge}><Text style={styles.vipBadgeText}>👑 VIP</Text></View>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.displayName || 'Explorer'}</Text>
          <Text style={styles.userMeta}>
            {user?.age || '—'} · {user?.gender || '—'}
          </Text>
          {user?.bio ? <Text style={styles.userBio}>{user.bio}</Text> : null}

          {/* Interest tags */}
          {interestItems.length > 0 && (
            <View style={styles.interestRow}>
              {interestItems.map(item => (
                <View key={item.id} style={styles.interestChip}>
                  <Text style={styles.interestEmoji}>{item.emoji}</Text>
                  <Text style={styles.interestLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🪙 {user?.coins || 0}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>💎 {user?.diamonds || 0}</Text>
              <Text style={styles.statLabel}>Diamonds</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followers?.size || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{following?.size || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => {
              setEditName(user?.displayName || '');
              setEditBio(user?.bio || '');
              setShowEditModal(true);
            }}>
              <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
            {!user?.isVip && (
              <TouchableOpacity style={styles.vipUpgradeBtn} onPress={() => navigation.navigate('Premium')}>
                <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.vipUpgradeBtnGradient}>
                  <Text style={styles.vipUpgradeBtnText}>👑 Get VIP</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Top up */}
        <TouchableOpacity style={styles.topUpBtn} onPress={() => navigation.navigate('CoinStore')} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.topUpBtnInner}>
            <Text style={styles.topUpIcon}>🪙</Text>
            <View style={styles.topUpContent}>
              <Text style={styles.topUpTitle}>Get Coins</Text>
              <Text style={styles.topUpSub}>Send gifts · Support creators</Text>
            </View>
            <Text style={styles.topUpArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item.id)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.badge && (
                  <View style={[styles.menuBadge, item.badge === 'NEW' && styles.menuBadgeNew]}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Text style={styles.menuChevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Log Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: logout },
          ])}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ConnectNow v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalLabel}>Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              maxLength={20}
            />
            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputBio]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell people about yourself..."
              placeholderTextColor={colors.textMuted}
              maxLength={100}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveProfile}>
                <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalSaveGradient}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileCard: { padding: 24, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 16 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarImageWrapper: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 44 },
  editPhotoBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
  editPhotoBadgeText: { fontSize: 14 },
  vipBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 2, borderColor: colors.background },
  vipBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  userName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  userMeta: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  userBio: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, marginBottom: 16, width: '100%', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.cardBorder },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  editBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.cardBorder, borderRadius: 24, paddingVertical: 12, alignItems: 'center' },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  vipUpgradeBtn: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  vipUpgradeBtnGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: 24 },
  vipUpgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  topUpBtn: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  topUpBtnInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  topUpIcon: { fontSize: 28 },
  topUpContent: { flex: 1 },
  topUpTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  topUpSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  topUpArrow: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  menuCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.backgroundSecondary, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, color: '#fff', fontSize: 15 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: { backgroundColor: colors.error, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  menuBadgeNew: { backgroundColor: colors.success },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  menuChevron: { color: colors.textMuted, fontSize: 20 },
  logoutBtn: { marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 16, padding: 16, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginBottom: 8 },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 },
  interestChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  interestEmoji: { fontSize: 13, marginRight: 4 },
  interestLabel: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#16161F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  modalLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.3)', borderRadius: 12, backgroundColor: colors.backgroundSecondary, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16 },
  modalInputBio: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 24, padding: 14, alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontSize: 15 },
  modalSave: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  modalSaveGradient: { padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
