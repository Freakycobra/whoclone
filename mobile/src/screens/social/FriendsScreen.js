import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useFriendStore } from '../../store/friendStore';

export default function FriendsScreen({ navigation }) {
  const { user } = useAuthStore();
  const { friends, pending, loading, loadFriends, acceptRequest, declineRequest, removeFriend } = useFriendStore();
  const [tab, setTab] = useState('friends'); // 'friends' | 'pending'

  useEffect(() => {
    if (user?.uid) loadFriends(user.uid);
  }, [user?.uid]);

  const handleAccept = (fromId) => acceptRequest(user.uid, fromId);
  const handleDecline = (fromId) => declineRequest(user.uid, fromId);
  const handleRemove = (friendId) => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFriend(user.uid, friendId) },
    ]);
  };

  const renderFriend = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.id?.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.displayName || item.id?.slice(0, 12)}</Text>
        <Text style={styles.cardSub}>Friend</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.dmBtn}
          onPress={() => navigation.navigate('ChatDM', { friendId: item.id })}
        >
          <Text style={styles.dmBtnText}>💬 DM</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPending = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.id?.slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.displayName || item.id?.slice(0, 12)}</Text>
        <Text style={styles.cardSub}>Wants to be friends</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
          <Text style={styles.acceptBtnText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleDecline(item.id)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const data = tab === 'friends' ? friends : pending;
  const empty = tab === 'friends'
    ? 'No friends yet. Add friends after video chats!'
    : 'No pending requests.';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => setTab('friends')}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            Friends {friends.length > 0 ? `(${friends.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Requests {pending.length > 0 ? `(${pending.length})` : ''}
          </Text>
          {pending.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pending.length}</Text></View>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={tab === 'friends' ? renderFriend : renderPending}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{tab === 'friends' ? '👥' : '📬'}</Text>
              <Text style={styles.emptyText}>{empty}</Text>
            </View>
          }
        />
      )}
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
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  badge: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cardSub: { color: colors.textMuted, fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  dmBtn: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.primary },
  dmBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  acceptBtn: { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.success },
  acceptBtnText: { color: colors.success, fontSize: 16, fontWeight: '700' },
  removeBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  removeBtnText: { color: colors.error || '#ef4444', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
