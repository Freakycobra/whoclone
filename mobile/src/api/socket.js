import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants';

let socket = null;

/**
 * Get or create the singleton socket connection.
 * Call connect() once when the user is authenticated.
 */
export const socketService = {
  connect(userId) {
    if (socket && socket.connected) return socket;

    socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
      query: { userId },
    });

    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log('[socket] connect error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  isConnected() {
    return socket?.connected || false;
  },

  // Join the matching queue
  joinQueue({ userId, profile, filters, superMatch = false }) {
    if (!socket) return;
    socket.emit('join_queue', { userId, profile, filters, superMatch });
  },

  // Skip current partner
  skipMatch(sessionId) {
    if (!socket) return;
    socket.emit('skip_match', { sessionId });
  },

  // End match gracefully
  endMatch(sessionId, rating = 0) {
    if (!socket) return;
    socket.emit('end_match', { sessionId, rating });
  },

  // Send a text message to partner
  sendMessage(sessionId, text) {
    if (!socket) return;
    socket.emit('send_message', { sessionId, text });
  },

  // Send a reaction emoji to partner
  sendReaction(sessionId, reaction) {
    if (!socket) return;
    socket.emit('send_reaction', { sessionId, reaction });
  },

  // Send a gift to partner
  sendGift(sessionId, gift, senderName) {
    if (!socket) return;
    socket.emit('send_gift', { sessionId, gift, senderName });
  },

  // Register a one-time or persistent event listener
  on(event, callback) {
    socket?.on(event, callback);
  },

  off(event, callback) {
    socket?.off(event, callback);
  },
};
