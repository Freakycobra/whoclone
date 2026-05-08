import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'expo-camera';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useLiveStore } from '../../store/liveStore';
import { socketService } from '../../api/socket';
import { GIFTS, API_BASE_URL } from '../../constants';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ navigation }) {
  const { user, spendCoins, addDiamonds } = useAuthStore();
  const { isStreaming, streamDiamonds, streamGifts, startStream, endStream, addStreamGift, setViewerCount, tickDuration, streamDuration } = useLiveStore();

  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCountLocal] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [cameraType, setCameraType] = useState('front');
  const [showGiftTray, setShowGiftTray] = useState(false);
  const [latestGift, setLatestGift] = useState(null);
  const [giftAnim] = useState(new Animated.Value(0));
  const [localDiamonds, setLocalDiamonds] = useState(0);

  const timerRef  = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    requestPermissions();
    return () => clearInterval(timerRef.current);
  }, []);

  const requestPermissions = async () => {
    try {
      const cam = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cam.status === 'granted');
      const mic = await Camera.requestMicrophonePermissionsAsync();
      setHasMicPermission(mic.status === 'granted');
    } catch (e) {}
  };

  const startLive = async () => {
    // If permissions haven't been granted yet, request them then proceed
    let camOk = hasCameraPermission;
    let micOk = hasMicPermission;

    if (!camOk || !micOk) {
      try {
        const cam = await Camera.requestCameraPermissionsAsync();
        camOk = cam.status === 'granted';
        setHasCameraPermission(camOk);
        const mic = await Camera.requestMicrophonePermissionsAsync();
        micOk = mic.status === 'granted';
        setHasMicPermission(micOk);
      } catch (e) {}
    }

    if (!camOk || !micOk) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone access are needed to go live. Please grant them in your device Settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    setIsLive(true);
    setLocalDiamonds(0);
    setViewerCountLocal(Math.floor(Math.random() * 10) + 1);
    setComments([{ id: '0', user: '🤖 System', text: 'Your stream is now live!', isSystem: true }]);
    startStream(streamTitle);

    // Register live stream on backend via socket
    const socket = socketService.connect(user?.uid || 'anon');
    socket.emit('live_start', { userId: user?.uid, title: streamTitle });

    // Listen for gifts via socket
    socket.off('live_gift_received');
    socket.on('live_gift_received', ({ gift, senderName, senderFlag }) => {
      handleGiftReceived(gift, senderName || 'Anonymous');
    });

    // Simulate viewer growth
    timerRef.current = setInterval(() => {
      setViewerCountLocal(v => Math.max(1, v + Math.floor(Math.random() * 3) - 1));
      // Simulate occasional comments from viewers
      if (Math.random() < 0.2) {
        const viewers = ['Sofia', 'Aryan', 'Mia', 'Zaid', 'Carlos', 'Priya'];
        const messages = ['Great stream! 🔥', 'Hello from India 🇮🇳', 'You are amazing!', '❤️❤️❤️', 'First time here!', 'Keep going!'];
        const name = viewers[Math.floor(Math.random() * viewers.length)];
        const text = messages[Math.floor(Math.random() * messages.length)];
        addComment({ user: name, text, isOwn: false });
      }
    }, 3000);
  };

  const handleGiftReceived = (gift, senderName) => {
    // Credit diamonds to local state
    const earned = gift.diamonds || Math.floor((gift.cost || 10) * 0.5);
    setLocalDiamonds(d => d + earned);
    addStreamGift(gift, senderName);

    // Show gift animation
    setLatestGift({ gift, sender: senderName });
    giftAnim.setValue(0);
    Animated.sequence([
      Animated.spring(giftAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(giftAnim, { toValue: 0, duration: 400, delay: 2000, useNativeDriver: true }),
    ]).start(() => setLatestGift(null));

    // Add system comment
    addComment({ user: '🎁 Gift', text: `${senderName} sent ${gift.name || gift.emoji}! (${earned}💎)`, isSystem: true });
  };

  const addComment = (comment) => {
    setComments(prev => {
      const updated = [...prev, { ...comment, id: Date.now().toString() + Math.random() }];
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return updated.slice(-50);
    });
  };

  const endLive = () => {
    Alert.alert('End Stream', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Stream',
        style: 'destructive',
        onPress: async () => {
          clearInterval(timerRef.current);

          // Notify backend
          const socket = socketService.connect(user?.uid || 'anon');
          socket.emit('live_end', { userId: user?.uid });

          // Credit diamonds to user account
          if (localDiamonds > 0) {
            addDiamonds(localDiamonds);
            try {
              await fetch(`${API_BASE_URL}/coins/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid, amount: 0, reason: 'live_stream_ended' }),
              });
            } catch (_) {}
          }

          setIsLive(false);
          endStream();

          const dur = formatDuration(streamDuration);
          Alert.alert(
            '📊 Stream Summary',
            `Duration: ${dur}\nPeak viewers: ${viewerCount}\n💎 Diamonds earned: ${localDiamonds}\nEquivalent: ~$${(localDiamonds * 0.003).toFixed(2)}`,
            [{ text: 'Great!', onPress: () => navigation.goBack() }]
          );
        },
      },
    ]);
  };

  // Gift sent BY VIEWER (if this user is a viewer watching a stream — future feature)
  // For now: this screen is streamer-only. Gift sending is from viewers in a separate screen.

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment({ user: user?.displayName || 'You', text: commentText, isOwn: true });
    setCommentText('');
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const giftScale   = giftAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.3, 1.3, 0] });
  const giftOpacity = giftAnim.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const giftY       = giftAnim.interpolate({ inputRange: [0, 1], outputRange: [60, -60] });

  // ─── SETUP SCREEN ──────────────────────────────────────────────────────────
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
          {/* Camera preview */}
          <View style={styles.previewBox}>
            {hasCameraPermission && Camera ? (
              <Camera style={StyleSheet.absoluteFill} type={cameraType} />
            ) : (
              <LinearGradient colors={['#1a0a2e', '#2d1b69']} style={styles.previewInner}>
                <Text style={styles.previewEmoji}>📡</Text>
                <Text style={styles.previewText}>
                  {hasCameraPermission === false ? 'Camera permission denied' : 'Camera preview'}
                </Text>
                {hasCameraPermission === false && (
                  <TouchableOpacity style={styles.permBtn} onPress={requestPermissions}>
                    <Text style={styles.permBtnText}>Grant Permission</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            )}
            {hasCameraPermission && (
              <TouchableOpacity style={styles.flipBtn} onPress={() => setCameraType(c => c === 'front' ? 'back' : 'front')}>
                <Text style={styles.flipBtnText}>🔄</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <View style={styles.setupField}>
            <Text style={styles.setupFieldLabel}>Stream Title <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.setupInput}
              placeholder="What's your stream about?"
              placeholderTextColor={colors.textMuted}
              value={streamTitle}
              onChangeText={setStreamTitle}
              maxLength={50}
            />
          </View>

          {/* Permissions status */}
          <View style={styles.permissionsCard}>
            <Text style={styles.permissionsTitle}>Required Permissions</Text>
            <View style={styles.permRow}>
              <Text style={styles.permIcon}>{hasCameraPermission ? '✅' : '❌'}</Text>
              <Text style={styles.permLabel}>Camera</Text>
              {!hasCameraPermission && <TouchableOpacity onPress={requestPermissions}><Text style={styles.permGrant}>Grant</Text></TouchableOpacity>}
            </View>
            <View style={styles.permRow}>
              <Text style={styles.permIcon}>{hasMicPermission ? '✅' : '❌'}</Text>
              <Text style={styles.permLabel}>Microphone</Text>
              {!hasMicPermission && <TouchableOpacity onPress={requestPermissions}><Text style={styles.permGrant}>Grant</Text></TouchableOpacity>}
            </View>
          </View>

          {/* Diamond earnings info */}
          <View style={styles.diamondInfo}>
            <Text style={styles.diamondInfoTitle}>💎 How earnings work</Text>
            {[
              ['Viewers send gifts → you earn Diamonds', '🎁'],
              ['100 Diamonds ≈ $0.30 (platform fee: 50%)', '💰'],
              ['Min withdrawal: 2,000 Diamonds', '📤'],
              ['Diamonds credited instantly to your profile', '⚡'],
            ].map(([text, icon]) => (
              <View key={text} style={styles.diamondRow}>
                <Text style={styles.diamondRowIcon}>{icon}</Text>
                <Text style={styles.diamondInfoText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Gift preview — what viewers can send */}
          <View style={styles.giftsPreview}>
            <Text style={styles.giftsPreviewTitle}>Gifts viewers can send you</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.giftsPreviewScroll}>
              {GIFTS.map(g => (
                <View key={g.id} style={styles.giftPreviewChip}>
                  <Text style={styles.giftPreviewEmoji}>{g.emoji}</Text>
                  <Text style={styles.giftPreviewName}>{g.name}</Text>
                  <Text style={styles.giftPreviewDiamond}>+{g.diamonds}💎</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity onPress={startLive} activeOpacity={0.85}>
            <LinearGradient
              colors={['#EF4444', '#EC4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.goLiveBtn}
            >
              <Text style={styles.goLiveText}>🔴 Go Live Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── LIVE SCREEN ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Camera */}
      {hasCameraPermission ? (
        <Camera style={StyleSheet.absoluteFill} type={cameraType} />
      ) : (
        <LinearGradient colors={['#1a0a2e', '#0A0A0F', '#2d1b69']} style={StyleSheet.absoluteFill} />
      )}

      {/* Top bar */}
      <View style={styles.liveTopBar}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
        <Text style={styles.liveTitle} numberOfLines={1}>
          {streamTitle || user?.displayName || 'Live Stream'}
        </Text>
        <TouchableOpacity style={styles.endBtn} onPress={endLive}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.liveStats}>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatIcon}>👁️</Text>
          <Text style={styles.liveStatValue}>{viewerCount}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatIcon}>💎</Text>
          <Text style={styles.liveStatValue}>{localDiamonds}</Text>
        </View>
        <View style={styles.liveStat}>
          <Text style={styles.liveStatIcon}>⏱️</Text>
          <Text style={styles.liveStatValue}>{formatDuration(streamDuration)}</Text>
        </View>
      </View>

      {/* Flip camera */}
      <TouchableOpacity style={styles.flipLiveBtn} onPress={() => setCameraType(c => c === 'front' ? 'back' : 'front')}>
        <Text style={styles.flipBtnText}>🔄</Text>
      </TouchableOpacity>

      {/* Gift animation */}
      {latestGift && (
        <Animated.View
          style={[styles.giftBurst, { opacity: giftOpacity, transform: [{ scale: giftScale }, { translateY: giftY }] }]}
          pointerEvents="none"
        >
          <Text style={styles.giftBurstEmoji}>{latestGift.gift.emoji}</Text>
          <Text style={styles.giftBurstText}>{latestGift.sender} sent {latestGift.gift.name}!</Text>
        </Animated.View>
      )}

      {/* Comments */}
      <View style={styles.commentsArea}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {comments.map((c) => (
            <View key={c.id} style={[styles.commentRow, c.isSystem && styles.commentRowSystem]}>
              <Text style={[styles.commentUser, c.isOwn && styles.commentUserOwn, c.isSystem && styles.commentUserSystem]}>
                {c.user}:
              </Text>
              <Text style={[styles.commentText, c.isSystem && styles.commentTextSystem]}> {c.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Gift tray panel */}
      {showGiftTray && (
        <View style={styles.giftTray}>
          <View style={styles.giftTrayHeader}>
            <Text style={styles.giftTrayTitle}>🎁 Send a Gift</Text>
            <View style={styles.coinBadge}>
              <Text style={styles.coinBadgeText}>🪙 {user?.coins || 0}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowGiftTray(false)}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.giftScroll}>
            {GIFTS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={styles.giftChip}
                onPress={async () => {
                  if ((user?.coins || 0) < g.cost) {
                    Alert.alert('Not enough coins', `Need ${g.cost} coins.`, [
                      { text: 'Buy Coins', onPress: () => navigation.navigate('CoinStore') },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                    return;
                  }
                  await spendCoins(g.cost, 'live_gift');
                  // In real app: emit to the streamer via socket
                  handleGiftReceived(g, user?.displayName || 'You');
                  setShowGiftTray(false);
                }}
              >
                <Text style={styles.giftChipEmoji}>{g.emoji}</Text>
                <Text style={styles.giftChipName}>{g.name}</Text>
                <Text style={styles.giftChipCost}>🪙{g.cost}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Comment input + gift button */}
      <View style={styles.commentInputRow}>
        <TouchableOpacity style={styles.giftTrayBtn} onPress={() => setShowGiftTray(t => !t)}>
          <Text style={styles.giftTrayBtnText}>🎁</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.commentInput}
          placeholder="Say something..."
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          onSubmitEditing={handleSendComment}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendCommentBtn} onPress={handleSendComment}>
          <Text style={styles.sendCommentIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Setup
  setupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  setupTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  setupContent: { padding: 20 },
  previewBox: { height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(239,68,68,0.3)' },
  previewInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewEmoji: { fontSize: 48, marginBottom: 8 },
  previewText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  permBtn: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  permBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  flipBtn: { position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  flipBtnText: { fontSize: 20 },
  setupField: { marginBottom: 20 },
  setupFieldLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  optional: { color: colors.textMuted, fontWeight: '400' },
  setupInput: { borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 14, backgroundColor: colors.backgroundSecondary, padding: 16, color: '#fff', fontSize: 15 },
  permissionsCard: { backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.cardBorder },
  permissionsTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  permIcon: { fontSize: 16 },
  permLabel: { flex: 1, color: colors.textSecondary, fontSize: 14 },
  permGrant: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  diamondInfo: { backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  diamondInfoTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  diamondRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  diamondRowIcon: { fontSize: 16, width: 20 },
  diamondInfoText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  giftsPreview: { backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.cardBorder },
  giftsPreviewTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  giftsPreviewScroll: { gap: 10, paddingRight: 8 },
  giftPreviewChip: { alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', minWidth: 68 },
  giftPreviewEmoji: { fontSize: 26, marginBottom: 3 },
  giftPreviewName: { color: colors.textSecondary, fontSize: 9, marginBottom: 2 },
  giftPreviewDiamond: { color: '#60A5FA', fontSize: 10, fontWeight: '700' },
  goLiveBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  goLiveText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  // Live
  liveTopBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, gap: 10, backgroundColor: 'rgba(0,0,0,0.45)' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.error, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  liveTitle: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  endBtn: { backgroundColor: 'rgba(239,68,68,0.3)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.error },
  endBtnText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  liveStats: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  liveStat: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, gap: 5 },
  liveStatIcon: { fontSize: 14 },
  liveStatValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  flipLiveBtn: { position: 'absolute', top: 130, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  giftBurst: { position: 'absolute', left: 0, right: 0, top: height * 0.38, alignItems: 'center', zIndex: 99 },
  giftBurstEmoji: { fontSize: 80 },
  giftBurstText: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 8, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20 },

  commentsArea: { position: 'absolute', bottom: 110, left: 16, right: 16, height: 200 },
  commentRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  commentRowSystem: { backgroundColor: 'rgba(124,58,237,0.2)' },
  commentUser: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  commentUserOwn: { color: colors.gold },
  commentUserSystem: { color: colors.primaryLight },
  commentText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  commentTextSystem: { color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' },

  giftTray: { position: 'absolute', bottom: 100, left: 0, right: 0, backgroundColor: 'rgba(13,13,20,0.97)', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  giftTrayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  giftTrayTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  coinBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', marginRight: 12 },
  coinBadgeText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  giftScroll: { gap: 10, paddingRight: 8 },
  giftChip: { alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: colors.cardBorder, minWidth: 70 },
  giftChipEmoji: { fontSize: 28, marginBottom: 3 },
  giftChipName: { color: colors.textSecondary, fontSize: 9, marginBottom: 3, textAlign: 'center' },
  giftChipCost: { color: colors.gold, fontSize: 11, fontWeight: '700' },

  commentInputRow: { position: 'absolute', bottom: 36, left: 16, right: 16, flexDirection: 'row', gap: 8, alignItems: 'center' },
  giftTrayBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  giftTrayBtnText: { fontSize: 22 },
  commentInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendCommentBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendCommentIcon: { color: '#fff', fontSize: 16 },
});
