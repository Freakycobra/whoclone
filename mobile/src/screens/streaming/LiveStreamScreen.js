import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { GIFTS } from '../../constants';

const { width, height } = Dimensions.get('window');

const MOCK_VIEWERS = [
  { id: '1', name: 'Rahul', flag: '🇮🇳', gift: null },
  { id: '2', name: 'Sari', flag: '🇮🇩', gift: '❤️' },
  { id: '3', name: 'Ahmed', flag: '🇧🇩', gift: null },
  { id: '4', name: 'Ana', flag: '🇵🇭', gift: '👑' },
];

const MOCK_COMMENTS = [
  { id: '1', user: 'Rahul 🇮🇳', text: 'Hello! 👋', time: Date.now() - 5000 },
  { id: '2', user: 'Sari 🇮🇩', text: 'You are so cool!', time: Date.now() - 3000 },
  { id: '3', user: 'Ahmed 🇧🇩', text: 'Nice stream 🔥', time: Date.now() - 1000 },
];

export default function LiveStreamScreen({ navigation }) {
  const { user } = useAuthStore();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [commentText, setCommentText] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer;
    if (isLive) {
      timer = setInterval(() => {
        setDuration(d => d + 1);
        // Simulate viewers joining/leaving
        setViewerCount(v => Math.max(1, v + Math.floor(Math.random() * 5) - 1));
        // Simulate random gifts
        if (Math.random() > 0.7) {
          const gift = GIFTS[Math.floor(Math.random() * 4)];
          setDiamonds(d => d + gift.diamonds);
          setComments(prev => [...prev, {
            id: Date.now().toString(),
            user: MOCK_VIEWERS[Math.floor(Math.random() * MOCK_VIEWERS.length)].name,
            text: `sent ${gift.emoji} ${gift.name}!`,
            time: Date.now(),
            isGift: true,
          }]);
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isLive]);

  const startLive = () => {
    if (!streamTitle.trim()) {
      Alert.alert('Add a title', 'Give your stream a title first');
      return;
    }
    setIsLive(true);
    setViewerCount(Math.floor(Math.random() * 20) + 5);
  };

  const endLive = () => {
    Alert.alert('End Stream', 'Are you sure you want to end your live stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Stream',
        style: 'destructive',
        onPress: () => {
          setIsLive(false);
          Alert.alert(
            '📊 Stream Summary',
            `Duration: ${formatDuration(duration)}\nPeak viewers: ${viewerCount}\nDiamonds earned: 💎 ${diamonds}\nEquivalent: ~$${(diamonds * 0.003).toFixed(2)}`
          );
          navigation.goBack();
        },
      },
    ]);
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!isLive) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

        <View style={styles.setupHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.setupTitle}>Start Live Stream</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.setupContent}>
          {/* Preview */}
          <View style={styles.previewBox}>
            <LinearGradient colors={['#1a0a2e', '#2d1b69']} style={styles.previewInner}>
              <Text style={styles.previewEmoji}>📡</Text>
              <Text style={styles.previewText}>Camera preview</Text>
              <Text style={styles.previewSub}>Will appear here when live</Text>
            </LinearGradient>
          </View>

          {/* Title */}
          <View style={styles.setupField}>
            <Text style={styles.setupFieldLabel}>Stream Title *</Text>
            <TextInput
              style={styles.setupInput}
              placeholder="What's your stream about?"
              placeholderTextColor={colors.textMuted}
              value={streamTitle}
              onChangeText={setStreamTitle}
              maxLength={50}
            />
          </View>

          {/* Topic */}
          <View style={styles.setupField}>
            <Text style={styles.setupFieldLabel}>Topic (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Chat', 'Music', 'Games', 'Dance', 'Study', 'Cooking', 'Q&A'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.topicChip, topic === t && styles.topicChipActive]}
                  onPress={() => setTopic(topic === t ? '' : t)}
                >
                  <Text style={[styles.topicChipText, topic === t && styles.topicChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Diamond info */}
          <View style={styles.diamondInfo}>
            <Text style={styles.diamondInfoTitle}>💎 How earnings work</Text>
            <Text style={styles.diamondInfoText}>
              Viewers send you virtual gifts → you earn Diamonds → withdraw as real money.{'\n\n'}
              Exchange rate: 100 Diamonds = ~$0.30{'\n'}
              Platform fee: 50% (standard in industry){'\n'}
              Minimum withdrawal: 2,000 Diamonds (~$6)
            </Text>
          </View>

          <TouchableOpacity onPress={startLive} activeOpacity={0.85}>
            <LinearGradient
              colors={['#EF4444', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.goLiveBtn}
            >
              <Text style={styles.goLiveText}>🔴 Go Live Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live video background */}
      <LinearGradient colors={['#1a0a2e', '#0A0A0F', '#2d1b69']} style={StyleSheet.absoluteFill} />

      {/* Stream visual placeholder */}
      <View style={styles.streamVideoArea}>
        <Text style={styles.streamEmoji}>📡</Text>
        <Text style={styles.streamYouText}>Your live video</Text>
      </View>

      {/* Top bar */}
      <View style={styles.liveTopBar}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
        <Text style={styles.liveTitle} numberOfLines={1}>{streamTitle}</Text>
        <TouchableOpacity style={styles.endBtn} onPress={endLive}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.liveStats}>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatIcon}>👁️</Text>
          <Text style={styles.liveStatValue}>{viewerCount}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatIcon}>💎</Text>
          <Text style={styles.liveStatValue}>{diamonds}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatIcon}>⏱️</Text>
          <Text style={styles.liveStatValue}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {/* Comments feed */}
      <View style={styles.commentsArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          ref={ref => ref && ref.scrollToEnd({ animated: true })}
        >
          {comments.map((c) => (
            <View key={c.id} style={[styles.commentRow, c.isGift && styles.commentRowGift]}>
              <Text style={styles.commentUser}>{c.user}:</Text>
              <Text style={[styles.commentText, c.isGift && styles.commentTextGift]}>{c.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Viewers row */}
      <View style={styles.viewersRow}>
        {MOCK_VIEWERS.slice(0, 4).map((v) => (
          <View key={v.id} style={styles.viewerAvatar}>
            <Text style={styles.viewerFlag}>{v.flag}</Text>
          </View>
        ))}
        {viewerCount > 4 && (
          <View style={[styles.viewerAvatar, styles.viewerMore]}>
            <Text style={styles.viewerMoreText}>+{viewerCount - 4}</Text>
          </View>
        )}
      </View>

      {/* Comment input */}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Say something..."
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={() => {
            if (commentText.trim()) {
              setComments(prev => [...prev, {
                id: Date.now().toString(),
                user: user?.displayName || 'You',
                text: commentText,
                time: Date.now(),
              }]);
              setCommentText('');
            }
          }}
        />
        <TouchableOpacity style={styles.rotateBtn}>
          <Text style={styles.rotateBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  setupTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  setupContent: { padding: 20 },
  previewBox: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  previewInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewEmoji: { fontSize: 48, marginBottom: 8 },
  previewText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  previewSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  setupField: { marginBottom: 20 },
  setupFieldLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  setupInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  topicChipActive: { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: colors.error },
  topicChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  topicChipTextActive: { color: colors.error },
  diamondInfo: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  diamondInfoTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  diamondInfoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  goLiveBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  goLiveText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  streamVideoArea: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: height * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamEmoji: { fontSize: 80, opacity: 0.3 },
  streamYouText: { color: 'rgba(255,255,255,0.3)', fontSize: 16 },
  liveTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    gap: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  liveTitle: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  endBtn: {
    backgroundColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  endBtnText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  liveStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 8,
  },
  liveStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  liveStatIcon: { fontSize: 14 },
  liveStatValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  commentsArea: {
    position: 'absolute',
    bottom: 160,
    left: 16,
    right: 16,
    height: 200,
  },
  commentRow: { marginBottom: 6 },
  commentRowGift: {},
  commentUser: { color: colors.primaryLight, fontSize: 12, fontWeight: '700' },
  commentText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  commentTextGift: { color: colors.gold, fontWeight: '600' },
  viewersRow: {
    position: 'absolute',
    top: 100,
    right: 16,
    flexDirection: 'column',
    gap: 6,
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFlag: { fontSize: 22 },
  viewerMore: { backgroundColor: 'rgba(124,58,237,0.5)' },
  viewerMoreText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  commentInputRow: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rotateBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotateBtnText: { fontSize: 22 },
});
