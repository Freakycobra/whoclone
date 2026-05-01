import client from './client';

export const matchingAPI = {
  // Start looking for a match
  startMatch: (filters) => client.post('/match/start', filters),

  // Skip current match
  skipMatch: (sessionId) => client.post('/match/skip', { sessionId }),

  // End current match
  endMatch: (sessionId, rating) => client.post('/match/end', { sessionId, rating }),

  // Report user
  reportUser: (userId, reason) => client.post('/users/report', { userId, reason }),

  // Block user
  blockUser: (userId) => client.post('/users/block', { userId }),

  // Add friend after chat
  addFriend: (userId) => client.post('/friends/add', { userId }),

  // Send gift during chat
  sendGift: (sessionId, giftId, recipientId) =>
    client.post('/gifts/send', { sessionId, giftId, recipientId }),
};
