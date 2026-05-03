import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useFriendStore } from '../../store/friendStore';

export default function ChatDMScreen({ navigation, route }) {
  const { friendId } = route.params;
  const { user } = useAuthStore();
  const { dmHistory, loadDMs, sendDM } = useFriendStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  const messages = dmHistory[friendId] || [];

  useEffect(() => {
    if (user?.uid && friendId) {
      loadDMs(user.uid, friendId).finally(() => setLoading(false));
    }
  }, [user?.uid, friendId]);

  // Poll for new messages every 3s
  useEffect(() => {
    if (!user?.uid || !friendId) return;
    const timer = setInterval(() => {
      loadDMs(user.uid, friendId);
    }, 3000);
    return () => clearInterval(timer);
  }, [user?.uid, friendId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid) return;
    setText('');
    setSending(true);
    await sendDM(user.uid, friendId, trimmed);
    setSending(false);
  };

  const renderMessage = ({ item }) => {
    const isMine = item.from === user?.uid;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {item.text}
          </Text>
          <Text style={styles.bubbleTime}>
            {new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#13131A']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{friendId?.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.headerName}>{friendId?.slice(0, 16)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Start a conversation!</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  headerName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 8, maxWidth: '78%' },
  msgRowRight: { alignSelf: 'flex-end' },
  msgRowLeft: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.backgroundSecondary, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.cardBorder },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextTheirs: { color: colors.text || '#fff' },
  bubbleTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 3, textAlign: 'right' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
    gap: 8,
  },
  input: {
    flex: 1, backgroundColor: colors.backgroundSecondary,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontSize: 14, maxHeight: 100,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
