import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'expo-camera';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { GIFTS } from '../../constants';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ navigation }) {
  const { user, updateUser } = useAuthStore();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMicPermission, setHasMicPermission] = useState(null);
  const [cameraType, setCameraType] = useState('front');
  const timerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
        setViewerCount(v => Math.max(1, v + Math.floor(Math.random() * 3) - 1));
      }, 3000);
    }
    return () => clearInterval(timerRef.current);
  }, [isLive]);

  const requestPermissions = async () => {
    try {
      const camResult = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(camResult.status === 'granted');
      const micResult = await Camera.requestMicrophonePermissionsAsync();
      setHasMicPermission(micResult.status === 'granted');
    } catch (e) {
      console.log('Permission error:', e);
    }
  };

  const startLive = () => {
    if (hasCameraPermission === false || hasMicPermission === false) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone access are needed to go live. Please enable them in your phone settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    setIsLive(true);
    setViewerCount(Math.floor(Math.random() * 10) + 1);
    setComments([]);
    setDiamonds(0);
  };

  const endLive = () => {
    Alert.alert('End Stream', 'Are you sure you want to end your live stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Stream',
        style: 'destructive',
        onPress: () => {
          clearInterval(timerRef.current);
          setIsLive(false);
          // Update user diamonds
          updateUser({ diamonds: (user?.diamonds || 0) + diamonds });
          Alert.alert(
            '📊 Stream Summary',
            `Duration: ${formatDuration(duration)}\nPeak viewers: ${viewerCount}\nDiamonds earned: 💎 ${diamonds}\nEquivalent: ~$${(diamonds * 0.003).toFixed(2)}`
          );
          navigation.goBack();
        },
      },
    ]);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    setComments(prev => {
      const updated = [...prev, {
        id: Date.now().toString(),
        user: user?.displayName || 'You',
        text: commentText,
        isOwn: true,
      }];
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return updated;
    });
    setCommentText('');
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Setup screen
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
              <Camera
                style={StyleSheet.absoluteFill}
                type={cameraType}
              />
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

          {/* Title (optional) */}
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
              {!hasCameraPermission && (
                <TouchableOpacity onPress={requestPermissions}>
                  <Text style={styles.permGrant}>Grant</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.permRow}>
              <Text style={styles.permIcon}>{hasMicPermission ? '✅' : '❌'}</Text>
              <Text style={styles.permLabel}>Microphone</Text>
              {!hasMicPermission && (
                <TouchableOpacity onPress={requestPermissions}>
                  <Text style={styles.permGrant}>Grant</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Diamond info */}
          <View style={styles.diamondInfo}>
            <Text style={styles.diamondInfoTitle}>💎 How earnings work</Text>
            <Text style={styles.diamondInfoText}>
              Viewers send you virtual gifts → you earn Diamonds → withdraw as real money.{'\n\n'}
              100 Diamonds ≈ $0.30 · Platform fee: 50% · Min withdrawal: 2,000 Diamonds
            </Text>
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

  // Live screen
  return (
    <View style={styles.container}>
      {/* Camera view */}
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
        {streamTitle ? (
          <Text style={styles.liveTitle} numberOfLines={1}>{streamTitle}</Text>
        ) : (
          <Text style={styles.liveTitle} numberOfLines={1}>{user?.displayName || 'Live Stream'}</Text>
        )}
        <TouchableOpacity style={styles.endBtn} onPress={endLive}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
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

      {/* Flip camera */}
      <TouchableOpacity
        style={styles.flipLiveBtn}
        onPress={() => setCameraType(c => c === 'front' ? 'back' : 'front')}
      >
        <Text style={styles.flipBtnText}>🔄</Text>
      </TouchableOpacity>

      {/* Comments */}
      <View style={styles.commentsArea}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {comments.length === 0 && (
            <Text style={styles.noComments}>Be the first to comment...</Text>
          )}
          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Text style={[styles.commentUser, c.isOwn && styles.commentUserOwn]}>{c.user}:</Text>
              <Text style={styles.commentText}> {c.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Comment input */}
      <View style={styles.commentInputRow}>
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
  diamondInfo: { backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.cardBorder },
  diamondInfoTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  diamondInfoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  goLiveBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  goLiveText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  // Live screen
  liveTopBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, gap: 10, backgroundColor: 'rgba(0,0,0,0.4)' },
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
  commentsArea: { position: 'absolute', bottom: 100, left: 16, right: 16, height: 180 },
  noComments: { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', marginTop: 20 },
  commentRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  commentUser: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  commentUserOwn: { color: colors.gold },
  commentText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  commentInputRow: { position: 'absolute', bottom: 36, left: 16, right: 16, flexDirection: 'row', gap: 10 },
  commentInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendCommentBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendCommentIcon: { color: '#fff', fontSize: 16 },
});
