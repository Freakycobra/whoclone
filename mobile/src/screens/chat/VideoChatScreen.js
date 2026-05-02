import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { matchingAPI } from '../../api/matching';
import { REACTIONS, GIFTS, AGORA_APP_ID } from '../../constants';

// Try to import Agora — falls back gracefully if not available
let RtcEngine, RtcLocalView, RtcRemoteView, VideoRenderMode, ClientRoleType;
try {
  const Agora = require('react-native-agora');
  RtcEngine = Agora.createAgoraRtcEngine ? Agora.createAgoraRtcEngine : null;
  RtcLocalView = Agora.RtcSurfaceView || null;
  RtcRemoteView = Agora.RtcSurfaceView || null;
  ClientRoleType = Agora.ClientRoleType;
} catch (e) {
  // Agora not available, use placeholder UI
}

const { width, height } = Dimensions.get('window');

// Mock match data for fallback
const MOCK_MATCHES = [
  { id: '1', displayName: 'Priya', flag: '🇮🇳', age: 23, gender: 'female' },
  { id: '2', displayName: 'Arif', flag: '🇧🇩', age: 25, gender: 'male' },
  { id: '3', displayName: 'Sari', flag: '🇮🇩', age: 21, gender: 'female' },
  { id: '4', displayName: 'Marco', flag: '🇵🇭', age: 27, gender: 'male' },
  { id: '5', displayName: 'Zeynep', flag: '🇹🇷', age: 22, gender: 'female' },
  { id: '6', displayName: 'Ali', flag: '🇵🇰', age: 24, gender: 'male' },
  { id: '7', displayName: 'Fatima', flag: '🇸🇦', age: 20, gender: 'female' },
  { id: '8', displayName: 'James', flag: '🇺🇸', age: 26, gender: 'male' },
];

export default function VideoChatScreen({ navigation }) {
  const { user, spendCoins } = useAuthStore();
  const { genderFilter, countryFilter, isConnected, currentMatch, messages, reactions, giftsReceived,
    setSearching, setConnected, disconnect, addMessage, addReaction, addGiftReceived } = useChatStore();

  const [chatText, setChatText] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [searchDots, setSearchDots] = useState('');
  const [remoteUid, setRemoteUid] = useState(null);
  const [agoraReady, setAgoraReady] = useState(false);

  const searchFadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const dotsRef = useRef(null);
  const engineRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    startSearching();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(dotsRef.current);
      leaveAgoraChannel();
      disconnect();
    };
  }, []);

  const initAgora = async (token, channel) => {
    if (!RtcEngine || !AGORA_APP_ID) return;
    try {
      engineRef.current = RtcEngine();
      await engineRef.current.initialize({ appId: AGORA_APP_ID });
      engineRef.current.addListener('onUserJoined', (connection, uid) => {
        setRemoteUid(uid);
      });
      engineRef.current.addListener('onUserOffline', () => {
        setRemoteUid(null);
      });
      await engineRef.current.enableVideo();
      await engineRef.current.startPreview();
      await engineRef.current.joinChannel(token, channel, 0, {});
      setAgoraReady(true);
    } catch (e) {
      console.log('Agora init error:', e.message);
    }
  };

  const leaveAgoraChannel = async () => {
    try {
      if (engineRef.current) {
        await engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    } catch (e) {}
    setAgoraReady(false);
    setRemoteUid(null);
  };

  const getMockMatch = () => {
    let pool = MOCK_MATCHES;
    if (genderFilter) pool = pool.filter(m => m.gender === genderFilter);
    return pool[Math.floor(Math.random() * pool.length)] || MOCK_MATCHES[0];
  };

  const startSearching = () => {
    setSearching(true);
    setSessionDuration(0);
    Animated.timing(searchFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    dotsRef.current = setInterval(() => {
      setSearchDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);

    const delay = 1500 + Math.random() * 2000;
    setTimeout(async () => {
      clearInterval(dotsRef.current);

      let matchData = getMockMatch();
      let agoraToken = null;
      let channelName = 'channel_' + Date.now();
      let sessionId = 'session_' + Date.now();

      try {
        const res = await matchingAPI.startMatch({
          genderFilter: genderFilter || null,
          countryFilter: countryFilter || null,
        });
        if (res.data?.match) matchData = res.data.match;
        if (res.data?.agoraToken) agoraToken = res.data.agoraToken;
        if (res.data?.channelName) channelName = res.data.channelName;
        if (res.data?.sessionId) sessionId = res.data.sessionId;
      } catch (e) {
        // backend not ready, use mock
      }

      sessionIdRef.current = sessionId;
      setConnected(matchData, sessionId, agoraToken, channelName);

      if (agoraToken) {
        await initAgora(agoraToken, channelName);
      }

      timerRef.current = setInterval(() => {
        setSessionDuration(d => d + 1);
      }, 1000);
    }, delay);
  };

  const handleSkip = async () => {
    clearInterval(timerRef.current);
    await leaveAgoraChannel();
    try { await matchingAPI.skipMatch(sessionIdRef.current); } catch (e) {}
    disconnect();
    startSearching();
  };

  const handleEnd = async () => {
    clearInterval(timerRef.current);
    await leaveAgoraChannel();
    disconnect();
    setShowRatingModal(true);
  };

  const handleRateAndExit = async (rating) => {
    try { await matchingAPI.endMatch(sessionIdRef.current, rating); } catch (e) {}
    setShowRatingModal(false);
    navigation.goBack();
  };

  const handleSendMessage = () => {
    if (!chatText.trim()) return;
    addMessage({ text: chatText, sender: 'me', time: new Date() });
    setChatText('');
  };

  const handleSendGift = (gift) => {
    if (!spendCoins(gift.cost)) {
      Alert.alert('Not enough coins', `You need ${gift.cost} coins.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Coins', onPress: () => navigation.navigate('CoinStore') },
      ]);
      return;
    }
    addGiftReceived(gift);
    setShowGifts(false);
    try { matchingAPI.sendGift(sessionIdRef.current, gift.id, currentMatch?.id); } catch (e) {}
  };

  const handleReport = () => {
    Alert.alert('Report User', 'Why are you reporting?', [
      { text: 'Inappropriate content', onPress: () => { matchingAPI.reportUser(currentMatch?.id, 'inappropriate').catch(() => {}); handleEnd(); }},
      { text: 'Harassment', onPress: () => { matchingAPI.reportUser(currentMatch?.id, 'harassment').catch(() => {}); handleEnd(); }},
      { text: 'Spam', onPress: () => { matchingAPI.reportUser(currentMatch?.id, 'spam').catch(() => {}); handleEnd(); }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleMute = async () => {
    setIsMuted(!isMuted);
    try { await engineRef.current?.muteLocalAudioStream(!isMuted); } catch (e) {}
  };

  const toggleCamera = async () => {
    setIsCameraOff(!isCameraOff);
    try { await engineRef.current?.muteLocalVideoStream(!isCameraOff); } catch (e) {}
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <View style={styles.container}>
      {/* Remote video */}
      <View style={styles.remoteVideo}>
        {isConnected ? (
          agoraReady && remoteUid && RtcRemoteView ? (
            <RtcRemoteView
              style={{ flex: 1 }}
              canvas={{ uid: remoteUid, renderMode: 1 }}
            />
          ) : (
            <LinearGradient colors={['#1a0a2e', '#2d1b69', '#1a0a2e']} style={styles.videoPlaceholder}>
              <Text style={styles.videoEmoji}>{currentMatch?.flag || '🌍'}</Text>
              <Text style={styles.videoName}>{currentMatch?.displayName}</Text>
              <Text style={styles.videoAge}>{currentMatch?.age} years old</Text>
            </LinearGradient>
          )
        ) : (
          <LinearGradient colors={['#0A0A0F', '#13131A', '#1a0a2e']} style={styles.videoPlaceholder}>
            <Animated.View style={{ opacity: searchFadeAnim, alignItems: 'center' }}>
              <View style={styles.searchSpinner}>
                <LinearGradient colors={['#7C3AED', '#EC4899']} style={styles.searchSpinnerInner}>
                  <Text style={styles.searchEmoji}>⚡</Text>
                </LinearGradient>
              </View>
              <Text style={styles.searchText}>Finding someone{searchDots}</Text>
              <Text style={styles.searchSub}>Connecting you worldwide</Text>
            </Animated.View>
          </LinearGradient>
        )}
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (isConnected) handleEnd();
          else { disconnect(); navigation.goBack(); }
        }}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        {isConnected && (
          <View style={styles.timerBadge}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formatDuration(sessionDuration)}</Text>
          </View>
        )}
        {isConnected && (
          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Text style={styles.reportIcon}>⚠️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Local video */}
      {isConnected && (
        <View style={styles.localVideo}>
          {agoraReady && RtcLocalView ? (
            <RtcLocalView style={{ flex: 1 }} canvas={{ renderMode: 1 }} />
          ) : (
            <LinearGradient colors={['#7C3AED', '#1a0a2e']} style={styles.localVideoInner}>
              <Text style={styles.localVideoText}>You</Text>
              {isCameraOff && <View style={styles.cameraOffOverlay}><Text>📷❌</Text></View>}
            </LinearGradient>
          )}
        </View>
      )}

      {/* Floating reactions */}
      <View style={styles.reactionsFloat} pointerEvents="none">
        {reactions.map((r) => (
          <Animated.Text key={r.id} style={styles.floatingReaction}>{r.reaction}</Animated.Text>
        ))}
      </View>

      {/* Gift notification */}
      {giftsReceived.length > 0 && (
        <View style={styles.giftNotif}>
          <Text style={styles.giftNotifText}>
            {giftsReceived[giftsReceived.length - 1].emoji} {giftsReceived[giftsReceived.length - 1].name}!
          </Text>
        </View>
      )}

      {/* Messages */}
      {isConnected && messages.length > 0 && (
        <View style={styles.messagesOverlay} pointerEvents="none">
          {messages.slice(-4).map((msg) => (
            <View key={msg.id} style={[styles.messageBubble, msg.sender === 'me' && styles.messageBubbleMe]}>
              <Text style={styles.messageBubbleText}>{msg.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom controls */}
      {isConnected && (
        <View style={styles.bottomControls}>
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={chatText}
              onChangeText={setChatText}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, isMuted && styles.actionBtnActive]} onPress={toggleMute}>
              <Text style={styles.actionBtnIcon}>{isMuted ? '🔇' : '🎤'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, isCameraOff && styles.actionBtnActive]} onPress={toggleCamera}>
              <Text style={styles.actionBtnIcon}>{isCameraOff ? '📷' : '📹'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setShowReactions(!showReactions); setShowGifts(false); }}>
              <Text style={styles.actionBtnIcon}>😊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { setShowGifts(!showGifts); setShowReactions(false); }}>
              <Text style={styles.actionBtnIcon}>🎁</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.skipBtnGradient}>
                <Text style={styles.skipBtnText}>SKIP ⏭</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {showReactions && (
            <View style={styles.panel}>
              {REACTIONS.map((r) => (
                <TouchableOpacity key={r} onPress={() => { addReaction(r); setShowReactions(false); }} style={styles.panelItem}>
                  <Text style={styles.panelEmoji}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showGifts && (
            <View style={styles.giftsPanel}>
              <Text style={styles.giftsPanelTitle}>🪙 {user?.coins || 0} coins</Text>
              <View style={styles.giftsGrid}>
                {GIFTS.map((g) => (
                  <TouchableOpacity key={g.id} style={styles.giftItem} onPress={() => handleSendGift(g)}>
                    <Text style={styles.giftEmoji}>{g.emoji}</Text>
                    <Text style={styles.giftName}>{g.name}</Text>
                    <View style={styles.giftCost}>
                      <Text style={styles.giftCostIcon}>🪙</Text>
                      <Text style={styles.giftCostText}>{g.cost}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {isConnected && sessionDuration > 30 && (
        <TouchableOpacity style={styles.addFriendBtn}>
          <Text style={styles.addFriendText}>➕ Add Friend</Text>
        </TouchableOpacity>
      )}

      {/* Rating modal */}
      {showRatingModal && (
        <View style={styles.ratingModal}>
          <LinearGradient colors={['#16161F', '#1C1C27']} style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was the chat?</Text>
            <Text style={styles.ratingWith}>with {currentMatch?.displayName || 'this person'}</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => handleRateAndExit(s)}>
                  <Text style={styles.ratingStar}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => handleRateAndExit(0)} style={styles.skipRating}>
              <Text style={styles.skipRatingText}>Skip rating</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoEmoji: { fontSize: 80, marginBottom: 16 },
  videoName: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  videoAge: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  searchSpinner: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 2, borderColor: 'rgba(124,58,237,0.4)',
  },
  searchSpinnerInner: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  searchEmoji: { fontSize: 40 },
  searchText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  searchSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  topBar: {
    position: 'absolute', top: 50, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, gap: 6 },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  timerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reportButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  reportIcon: { fontSize: 18 },
  localVideo: { position: 'absolute', top: 100, right: 16, width: 100, height: 140, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  localVideoInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  localVideoText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  cameraOffOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  reactionsFloat: { position: 'absolute', left: 16, bottom: 300, gap: 8 },
  floatingReaction: { fontSize: 36, marginBottom: 8 },
  giftNotif: { position: 'absolute', top: 160, left: 0, right: 0, alignItems: 'center' },
  giftNotifText: { backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  messagesOverlay: { position: 'absolute', bottom: 280, left: 16, right: 120, gap: 6 },
  messageBubble: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', maxWidth: '80%' },
  messageBubbleMe: { alignSelf: 'flex-end', backgroundColor: 'rgba(124,58,237,0.7)' },
  messageBubbleText: { color: '#fff', fontSize: 14 },
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 32 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 8 },
  chatInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 10 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnActive: { backgroundColor: 'rgba(124,58,237,0.3)', borderColor: colors.primary },
  actionBtnIcon: { fontSize: 20 },
  skipBtn: { marginLeft: 8 },
  skipBtnGradient: { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 24 },
  skipBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  panel: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 16, padding: 12, marginBottom: 12, justifyContent: 'space-around' },
  panelItem: { padding: 8 },
  panelEmoji: { fontSize: 32 },
  giftsPanel: { backgroundColor: 'rgba(13,13,20,0.95)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  giftsPanelTitle: { color: colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  giftsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  giftItem: { width: (width - 80) / 5, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: colors.cardBorder },
  giftEmoji: { fontSize: 26, marginBottom: 2 },
  giftName: { color: colors.textSecondary, fontSize: 9, marginBottom: 4, textAlign: 'center' },
  giftCost: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  giftCostIcon: { fontSize: 10 },
  giftCostText: { color: colors.gold, fontSize: 11, fontWeight: '700' },
  addFriendBtn: { position: 'absolute', top: 260, right: 16, backgroundColor: 'rgba(124,58,237,0.85)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  addFriendText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  ratingModal: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center' },
  ratingCard: { width: width - 48, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  ratingTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  ratingWith: { color: colors.textSecondary, fontSize: 14, marginBottom: 24 },
  ratingStars: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  ratingStar: { fontSize: 40 },
  skipRating: { padding: 12 },
  skipRatingText: { color: colors.textMuted, fontSize: 14 },
});
