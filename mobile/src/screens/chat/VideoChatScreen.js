import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useFollowStore } from '../../store/followStore';
import { useFriendStore } from '../../store/friendStore';
import { socketService } from '../../api/socket';
import { moderationAPI } from '../../api/moderation';
import { REACTIONS, GIFTS, API_BASE_URL } from '../../constants';
import ReportModal from '../../components/ReportModal';

// Agora — graceful fallback if native module not linked yet
let createAgoraRtcEngine, RtcSurfaceView, ChannelProfileType, ClientRoleType;
try {
  const Agora = require('react-native-agora');
  createAgoraRtcEngine = Agora.createAgoraRtcEngine;
  RtcSurfaceView = Agora.RtcSurfaceView;
  ChannelProfileType = Agora.ChannelProfileType;
  ClientRoleType = Agora.ClientRoleType;
} catch (_) {}

const { width, height } = Dimensions.get('window');

export default function VideoChatScreen({ navigation }) {
  const { user, spendCoins } = useAuthStore();
  const { follow, isFollowing } = useFollowStore();
  const { sendRequest, checkFriendship } = useFriendStore();
  const [friendStatus, setFriendStatus] = useState({ areFriends: false, requestSent: false });
  const {
    genderFilter, countryFilter, superMatch, setSuperMatch,
    isConnected, currentMatch, messages, reactions, giftsReceived,
    setSearching, setConnected, disconnect,
    addMessage, addReaction, addGiftReceived,
  } = useChatStore();

  // UI state
  const [chatText, setChatText]             = useState('');
  const [showGifts, setShowGifts]           = useState(false);
  const [showReactions, setShowReactions]   = useState(false);
  const [isMuted, setIsMuted]               = useState(false);
  const [isCameraOff, setIsCameraOff]       = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [searchDots, setSearchDots]         = useState('');
  const [timesUpVisible, setTimesUpVisible] = useState(false);
  const [latestGift, setLatestGift]         = useState(null);
  const [giftAnim]                          = useState(new Animated.Value(0));
  const [searchFadeAnim]                    = useState(new Animated.Value(0));
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Agora state
  const [remoteUid, setRemoteUid]   = useState(null);
  const [agoraReady, setAgoraReady] = useState(false);

  // Refs
  const timerRef        = useRef(null);
  const dotsRef         = useRef(null);
  const genderTimerRef  = useRef(null);
  const engineRef       = useRef(null);
  const sessionIdRef    = useRef(null);
  const isMatchedRef    = useRef(false);   // prevents double-match
  const ratingDataRef   = useRef(null);

  // ── Mount / unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    startSearching();
    return () => cleanup(false);
  }, []);

  const cleanup = useCallback((emitEnd = true) => {
    clearInterval(timerRef.current);
    clearInterval(dotsRef.current);
    clearTimeout(genderTimerRef.current);
    if (emitEnd && sessionIdRef.current) {
      socketService.endMatch(sessionIdRef.current, 0);
    }
    leaveAgora();
    disconnect();
    isMatchedRef.current = false;
  }, []);

  // ── Agora ─────────────────────────────────────────────────────────────────
  const initAgora = async (appId, token, channelName, uid) => {
    if (!createAgoraRtcEngine || !appId || !token) return false;
    try {
      engineRef.current = createAgoraRtcEngine();
      await engineRef.current.initialize({ appId });
      await engineRef.current.enableVideo();
      await engineRef.current.startPreview();

      engineRef.current.registerEventHandler({
        onUserJoined: (connection, uid) => { setRemoteUid(uid); },
        onUserOffline: () => { setRemoteUid(null); },
        onError: (err) => { console.log('[agora] error:', err); },
      });

      await engineRef.current.joinChannel(token, channelName, uid, {
        channelProfile: ChannelProfileType?.ChannelProfileCommunication ?? 0,
        clientRoleType: ClientRoleType?.ClientRoleBroadcaster ?? 1,
      });

      setAgoraReady(true);
      return true;
    } catch (e) {
      console.log('[agora] init error:', e.message);
      return false;
    }
  };

  const leaveAgora = async () => {
    try {
      if (engineRef.current) {
        await engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    } catch (_) {}
    setAgoraReady(false);
    setRemoteUid(null);
  };

  // ── Socket matching ───────────────────────────────────────────────────────
  const startSearching = () => {
    isMatchedRef.current = false;
    setSearching(true);
    setSessionDuration(0);

    Animated.timing(searchFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Animated dots
    dotsRef.current = setInterval(() => {
      setSearchDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 500);

    // Ensure socket connected
    const socket = socketService.connect(user?.uid || 'anon');

    // Register events fresh each search
    socket.off('match_found');
    socket.off('partner_skipped');
    socket.off('partner_ended');
    socket.off('partner_disconnected');
    socket.off('receive_message');
    socket.off('receive_reaction');
    socket.off('receive_gift');

    socket.on('match_found', async (data) => {
      if (isMatchedRef.current) return;
      isMatchedRef.current = true;
      clearInterval(dotsRef.current);

      sessionIdRef.current = data.sessionId;
      setConnected(data.partner, data.sessionId, data.agoraToken, data.channelName);

      // Check friend status with matched user
      if (user?.uid && data.partner?.id) {
        checkFriendship(user.uid, data.partner.id).then(setFriendStatus);
      }

      // Start session timer
      timerRef.current = setInterval(() => setSessionDuration(d => d + 1), 1000);

      // Gender filter session time-limit (20–30s)
      if (genderFilter) {
        const limit = 20000 + Math.random() * 10000;
        genderTimerRef.current = setTimeout(() => {
          setTimesUpVisible(true);
          setTimeout(() => { setTimesUpVisible(false); handleSkip(); }, 2000);
        }, limit);
      }

      // Init Agora with server-provided token
      if (data.agoraToken && data.agoraAppId && data.channelName) {
        await initAgora(data.agoraAppId, data.agoraToken, data.channelName, data.agoraUid || 0);
      }
    });

    socket.on('partner_skipped',      () => { handlePartnerLeft('skipped'); });
    socket.on('partner_ended',        () => { handlePartnerLeft('ended'); });
    socket.on('partner_disconnected', () => { handlePartnerLeft('disconnected'); });

    socket.on('receive_message', ({ text }) => {
      addMessage({ text, sender: 'them', time: new Date() });
    });

    socket.on('receive_reaction', ({ reaction }) => {
      addReaction(reaction);
    });

    socket.on('receive_gift', ({ gift, senderName }) => {
      addGiftReceived(gift);
      showGiftAnimation(gift, senderName);
    });

    // Join the queue
    const countryCode = user?.country || null;
    const flagMap = { IN:'🇮🇳',BD:'🇧🇩',ID:'🇮🇩',PH:'🇵🇭',TR:'🇹🇷',PK:'🇵🇰',AE:'🇦🇪',SA:'🇸🇦',US:'🇺🇸',GB:'🇬🇧',EG:'🇪🇬',NG:'🇳🇬',BR:'🇧🇷',MX:'🇲🇽' };

    socketService.joinQueue({
      userId: user?.uid || 'anon_' + Date.now(),
      profile: {
        displayName: user?.displayName || 'Anonymous',
        flag: (countryCode && flagMap[countryCode]) || '🌍',
        age: user?.age || null,
        gender: user?.gender || null,
        country: countryCode,
        avatar: user?.photoURL || null,
      },
      filters: {
        genderFilter: genderFilter || null,
        countryFilter: countryFilter || null,
      },
      superMatch: !!superMatch,
    });
    // Reset super match after use
    if (superMatch) setSuperMatch(false);
  };

  const handlePartnerLeft = (reason) => {
    clearInterval(timerRef.current);
    clearTimeout(genderTimerRef.current);
    leaveAgora();
    isMatchedRef.current = false;
    // Brief message then re-search
    Alert.alert(
      reason === 'skipped' ? '⏭ Skipped' : '👋 Partner Left',
      'Finding your next match...',
      [{ text: 'OK', onPress: startSearching }],
      { cancelable: false }
    );
    disconnect();
  };

  const handleSkip = async () => {
    clearInterval(timerRef.current);
    clearTimeout(genderTimerRef.current);
    if (sessionIdRef.current) socketService.skipMatch(sessionIdRef.current);
    await leaveAgora();
    disconnect();
    isMatchedRef.current = false;
    startSearching();
  };

  const handleEnd = async () => {
    clearInterval(timerRef.current);
    clearTimeout(genderTimerRef.current);
    await leaveAgora();
    disconnect();
    setShowRatingModal(true);
  };

  const handleRateAndExit = (rating) => {
    if (sessionIdRef.current) socketService.endMatch(sessionIdRef.current, rating);
    setShowRatingModal(false);
    navigation.goBack();
  };

  // ── Chat & interactions ───────────────────────────────────────────────────
  const handleSendMessage = async () => {
    const text = chatText.trim();
    if (!text) return;
    setChatText('');
    try {
      const res = await moderationAPI.checkText(text);
      if (res?.data?.flagged) {
        addMessage({ text: '⚠️ Message blocked: ' + (res.data.reason || 'content policy violation'), sender: 'system', time: new Date() });
        return;
      }
    } catch {
      // fail open — API down, allow message through
    }
    addMessage({ text, sender: 'me', time: new Date() });
    socketService.sendMessage(sessionIdRef.current, text);
  };

  const handleSendReaction = (reaction) => {
    addReaction(reaction);
    socketService.sendReaction(sessionIdRef.current, reaction);
    setShowReactions(false);
  };

  const handleSendGift = (gift) => {
    if (!spendCoins(gift.cost)) {
      Alert.alert('Not enough coins', `You need ${gift.cost} coins to send ${gift.name}.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Coins', onPress: () => navigation.navigate('CoinStore') },
      ]);
      return;
    }
    addGiftReceived(gift); // local echo
    socketService.sendGift(sessionIdRef.current, gift, user?.displayName || 'You');
    setShowGifts(false);
    showGiftAnimation(gift, 'You');
  };

  const showGiftAnimation = (gift, sender) => {
    setLatestGift({ gift, sender });
    giftAnim.setValue(0);
    Animated.sequence([
      Animated.spring(giftAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(giftAnim, { toValue: 0, duration: 400, delay: 1800, useNativeDriver: true }),
    ]).start(() => setLatestGift(null));
  };

  const handleBlock = () => {
    if (!currentMatch?.id || !user?.uid) return;
    Alert.alert(
      'Block User',
      'This person won\'t be matched with you again.',
      [
        {
          text: 'Block & Skip',
          style: 'destructive',
          onPress: () => {
            fetch(`${API_BASE_URL}/users/block`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ blockerId: user.uid, blockedId: currentMatch.id }),
            }).catch(() => {});
            handleSkip();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleReport = () => setReportModalVisible(true);

  const toggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try { await engineRef.current?.muteLocalAudioStream(next); } catch (_) {}
  };

  const toggleCamera = async () => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    try { await engineRef.current?.muteLocalVideoStream(next); } catch (_) {}
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // Gift animation values
  const giftScale   = giftAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.2, 0] });
  const giftOpacity = giftAnim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const giftY       = giftAnim.interpolate({ inputRange: [0, 1], outputRange: [50, -60] });

  return (
    <View style={styles.container}>

      {/* ── Remote video / searching screen ── */}
      <View style={styles.remoteVideo}>
        {isConnected ? (
          agoraReady && remoteUid && RtcSurfaceView ? (
            <RtcSurfaceView style={{ flex: 1 }} canvas={{ uid: remoteUid, renderMode: 1 }} />
          ) : (
            <LinearGradient colors={['#1a0a2e', '#2d1b69', '#1a0a2e']} style={styles.videoPlaceholder}>
              <Text style={styles.videoEmoji}>{currentMatch?.flag || '🌍'}</Text>
              <Text style={styles.videoName}>{currentMatch?.displayName || 'Anonymous'}</Text>
              {currentMatch?.age && <Text style={styles.videoAge}>{currentMatch.age} yrs</Text>}
              <View style={styles.liveTag}><Text style={styles.liveTagText}>● LIVE</Text></View>
            </LinearGradient>
          )
        ) : (
          <LinearGradient colors={['#0A0A0F', '#13131A', '#1a0a2e']} style={styles.videoPlaceholder}>
            <Animated.View style={{ opacity: searchFadeAnim, alignItems: 'center' }}>
              <View style={styles.searchRing}>
                <LinearGradient colors={['#7C3AED', '#EC4899']} style={styles.searchInner}>
                  <Text style={styles.searchEmoji}>⚡</Text>
                </LinearGradient>
              </View>
              <Text style={styles.searchText}>Finding someone{searchDots}</Text>
              <Text style={styles.searchSub}>Connecting you worldwide</Text>
              {(genderFilter || countryFilter) && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {genderFilter ? `👤 ${genderFilter}` : ''}{genderFilter && countryFilter ? '  ' : ''}{countryFilter ? `🌍 ${countryFilter}` : ''}
                  </Text>
                </View>
              )}
            </Animated.View>
          </LinearGradient>
        )}
      </View>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => {
          if (isConnected) handleEnd(); else { cleanup(false); navigation.goBack(); }
        }}>
          <Text style={styles.iconBtnText}>✕</Text>
        </TouchableOpacity>

        {isConnected && (
          <View style={styles.timerBadge}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formatDuration(sessionDuration)}</Text>
          </View>
        )}

        {isConnected ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handleReport}>
            <Text style={styles.iconBtnText}>⚠️</Text>
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}
      </View>

      {/* ── Local video preview ── */}
      {isConnected && (
        <View style={styles.localVideo}>
          {agoraReady && RtcSurfaceView ? (
            <RtcSurfaceView style={{ flex: 1 }} canvas={{ uid: 0, renderMode: 1 }} />
          ) : (
            <LinearGradient colors={['#7C3AED', '#1a0a2e']} style={styles.localVideoInner}>
              <Text style={styles.localVideoLabel}>You</Text>
            </LinearGradient>
          )}
          {isCameraOff && (
            <View style={styles.camOffOverlay}>
              <Text style={{ fontSize: 22 }}>📷❌</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Floating reactions ── */}
      <View style={styles.reactionsFloat} pointerEvents="none">
        {reactions.map((r) => (
          <Animated.Text key={r.id} style={styles.floatingReaction}>{r.reaction}</Animated.Text>
        ))}
      </View>

      {/* ── Gift animation ── */}
      {latestGift && (
        <Animated.View
          style={[styles.giftBurst, { opacity: giftOpacity, transform: [{ scale: giftScale }, { translateY: giftY }] }]}
          pointerEvents="none"
        >
          <Text style={styles.giftBurstEmoji}>{latestGift.gift.emoji}</Text>
          <Text style={styles.giftBurstName}>{latestGift.sender} sent {latestGift.gift.name}!</Text>
        </Animated.View>
      )}

      {/* ── Messages overlay ── */}
      {isConnected && messages.length > 0 && (
        <View style={styles.messagesOverlay} pointerEvents="none">
          {messages.slice(-4).map((msg) => (
            <View key={msg.id} style={[styles.msgBubble, msg.sender === 'me' && styles.msgBubbleMe]}>
              <Text style={styles.msgText}>{msg.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Bottom controls ── */}
      {isConnected && (
        <View style={styles.bottomControls}>
          {/* Text input */}
          <View style={styles.chatRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Say something..."
              placeholderTextColor={colors.textMuted}
              value={chatText}
              onChangeText={setChatText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, isMuted && styles.actionBtnOn]} onPress={toggleMute}>
              <Text style={styles.actionBtnIcon}>{isMuted ? '🔇' : '🎤'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, isCameraOff && styles.actionBtnOn]} onPress={toggleCamera}>
              <Text style={styles.actionBtnIcon}>{isCameraOff ? '📷' : '📹'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, showReactions && styles.actionBtnOn]}
              onPress={() => { setShowReactions(!showReactions); setShowGifts(false); }}
            >
              <Text style={styles.actionBtnIcon}>😊</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, showGifts && styles.actionBtnOn]}
              onPress={() => { setShowGifts(!showGifts); setShowReactions(false); }}
            >
              <Text style={styles.actionBtnIcon}>🎁</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.skipBtnInner}>
                <Text style={styles.skipBtnText}>SKIP ⏭</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Reactions panel */}
          {showReactions && (
            <View style={styles.panel}>
              {REACTIONS.map((r) => (
                <TouchableOpacity key={r} onPress={() => handleSendReaction(r)} style={styles.panelItem}>
                  <Text style={styles.panelEmoji}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Gift panel */}
          {showGifts && (
            <View style={styles.giftsPanel}>
              <View style={styles.giftsPanelHeader}>
                <Text style={styles.giftsPanelTitle}>Send a Gift</Text>
                <View style={styles.coinBadge}>
                  <Text style={styles.coinBadgeText}>🪙 {user?.coins || 0}</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.giftsScroll}>
                {GIFTS.map((g) => (
                  <TouchableOpacity key={g.id} style={styles.giftChip} onPress={() => handleSendGift(g)}>
                    <Text style={styles.giftChipEmoji}>{g.emoji}</Text>
                    <Text style={styles.giftChipName}>{g.name}</Text>
                    <Text style={styles.giftChipCost}>🪙{g.cost}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* ── Follow button (after 10s) ── */}
      {isConnected && sessionDuration > 10 && currentMatch?.id && (
        <TouchableOpacity
          style={[styles.addFriendBtn, isFollowing(currentMatch.id) && styles.addFriendBtnActive]}
          onPress={async () => {
            if (!isFollowing(currentMatch.id)) {
              await follow(
                currentMatch.id,
                { displayName: currentMatch.displayName, avatar: currentMatch.photoUrl },
                user?.id,
              );
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addFriendText}>
            {isFollowing(currentMatch.id) ? '✅ Following' : '➕ Follow'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Time's up overlay ── */}
      {timesUpVisible && (
        <View style={styles.overlay}>
          <LinearGradient colors={['rgba(124,58,237,0.94)', 'rgba(236,72,153,0.94)']} style={styles.overlayCard}>
            <Text style={styles.overlayEmoji}>⏱</Text>
            <Text style={styles.overlayTitle}>Time's Up!</Text>
            <Text style={styles.overlaySub}>Finding next match...</Text>
          </LinearGradient>
        </View>
      )}

      {/* ── Rating modal ── */}
      {showRatingModal && (
        <View style={styles.overlay}>
          <LinearGradient colors={['#16161F', '#1C1C27']} style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was the chat?</Text>
            <Text style={styles.ratingWith}>with {currentMatch?.displayName || 'this person'}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => handleRateAndExit(s)} style={styles.starBtn}>
                  <Text style={styles.starEmoji}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Friend button */}
            {currentMatch?.id && !friendStatus.areFriends && (
              <TouchableOpacity
                style={[styles.addFriendBtn, friendStatus.requestSent && styles.addFriendBtnSent]}
                onPress={async () => {
                  if (friendStatus.requestSent) return;
                  const result = await sendRequest(user.uid, currentMatch.id);
                  if (result?.success !== false) {
                    setFriendStatus((s) => ({ ...s, requestSent: true }));
                  }
                }}
              >
                <Text style={styles.addFriendBtnText}>
                  {friendStatus.requestSent ? '✓ Request Sent' : '👥 Add Friend'}
                </Text>
              </TouchableOpacity>
            )}
            {friendStatus.areFriends && (
              <View style={styles.alreadyFriendBadge}>
                <Text style={styles.alreadyFriendText}>✓ Already Friends</Text>
              </View>
            )}

            <TouchableOpacity onPress={() => handleRateAndExit(0)} style={styles.skipRatingBtn}>
              <Text style={styles.skipRatingText}>Skip rating</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reporterId={user?.uid}
        reportedId={currentMatch?.id}
        reportedName={currentMatch?.displayName}
        sessionId={sessionIdRef.current}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  remoteVideo: { ...StyleSheet.absoluteFillObject },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoEmoji: { fontSize: 80, marginBottom: 12 },
  videoName: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 4 },
  videoAge: { color: 'rgba(255,255,255,0.55)', fontSize: 15 },
  liveTag: { marginTop: 12, backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  liveTagText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  searchRing: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(124,58,237,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 2, borderColor: 'rgba(124,58,237,0.35)' },
  searchInner: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  searchEmoji: { fontSize: 42 },
  searchText: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  searchSub: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 16 },
  filterBadge: { backgroundColor: 'rgba(124,58,237,0.35)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(124,58,237,0.5)' },
  filterBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  topBar: { position: 'absolute', top: 52, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, justifyContent: 'space-between' },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, gap: 6 },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  timerText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  localVideo: { position: 'absolute', top: 108, right: 14, width: 100, height: 144, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' },
  localVideoInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  localVideoLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  camOffOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },

  reactionsFloat: { position: 'absolute', left: 14, bottom: 310, gap: 8 },
  floatingReaction: { fontSize: 34, marginBottom: 6 },

  giftBurst: { position: 'absolute', left: 0, right: 0, top: height * 0.38, alignItems: 'center', zIndex: 99 },
  giftBurstEmoji: { fontSize: 72 },
  giftBurstName: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20 },

  messagesOverlay: { position: 'absolute', bottom: 290, left: 14, right: 128, gap: 5 },
  msgBubble: { backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', maxWidth: '85%' },
  msgBubbleMe: { alignSelf: 'flex-end', backgroundColor: 'rgba(124,58,237,0.72)' },
  msgText: { color: '#fff', fontSize: 14 },

  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 28 },
  chatRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 2, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 8 },
  chatInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 10 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 14 },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnOn: { backgroundColor: 'rgba(124,58,237,0.35)', borderColor: colors.primary },
  actionBtnIcon: { fontSize: 20 },
  skipBtn: { marginLeft: 6 },
  skipBtnInner: { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 24 },
  skipBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  panel: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.88)', borderRadius: 16, padding: 10, marginBottom: 10, justifyContent: 'space-around' },
  panelItem: { padding: 7 },
  panelEmoji: { fontSize: 30 },

  giftsPanel: { backgroundColor: 'rgba(13,13,20,0.96)', borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  giftsPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  giftsPanelTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  coinBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)' },
  coinBadgeText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  giftsScroll: { gap: 8, paddingRight: 8 },
  giftChip: { alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: colors.cardBorder, minWidth: 72 },
  giftChipEmoji: { fontSize: 28, marginBottom: 3 },
  giftChipName: { color: colors.textSecondary, fontSize: 9, marginBottom: 3, textAlign: 'center' },
  giftChipCost: { color: colors.gold, fontSize: 11, fontWeight: '700' },

  addFriendBtn: { position: 'absolute', top: 270, right: 14, backgroundColor: 'rgba(124,58,237,0.85)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  addFriendBtnActive: { backgroundColor: 'rgba(34,197,94,0.85)' },
  addFriendText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  overlayCard: { borderRadius: 28, paddingHorizontal: 52, paddingVertical: 36, alignItems: 'center' },
  overlayEmoji: { fontSize: 60, marginBottom: 8 },
  overlayTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginBottom: 6 },
  overlaySub: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },

  ratingCard: { width: width - 48, borderRadius: 26, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  ratingTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  ratingWith: { color: colors.textSecondary, fontSize: 14, marginBottom: 26 },
  addFriendBtn: { marginTop: 16, backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12, borderWidth: 1, borderColor: colors.primary },
  addFriendBtnSent: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: colors.success },
  addFriendBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  alreadyFriendBadge: { marginTop: 16, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1, borderColor: colors.success },
  alreadyFriendText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  starBtn: { padding: 4 },
  starEmoji: { fontSize: 40 },
  skipRatingBtn: { padding: 12 },
  skipRatingText: { color: colors.textMuted, fontSize: 14 },
});
