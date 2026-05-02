import client from './client';
import { AGORA_APP_ID } from '../constants';

export const agoraAPI = {
  // Get a token for a video channel
  getToken: (channelName, uid = 0) =>
    client.get(`/agora/token?channel=${channelName}&uid=${uid}`),
};

export { AGORA_APP_ID };
