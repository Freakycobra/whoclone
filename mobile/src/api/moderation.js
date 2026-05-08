import client from './client';

export const moderationAPI = {
  // Check text before sending to server
  checkText: (text) => client.post('/moderation/text', { text }),

  // Check image URL after upload
  checkImage: (imageUrl) => client.post('/moderation/image', { imageUrl }),

  // Submit a report against another user
  report: ({ reporterId, reportedId, reportedName, reason, context, sessionId }) =>
    client.post('/moderation/report', { reporterId, reportedId, reportedName, reason, context, sessionId }),
};
