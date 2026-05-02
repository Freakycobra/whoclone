const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = process.env.AGORA_APP_ID || '69107017812e4c81bfa122c70d2b0750';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '8f2946b9852148d1b83bb97dccdc0116';

/**
 * Generate a short-lived Agora RTC token for a video call channel
 * @param {string} channelName - unique channel name for the session
 * @param {number} uid - user ID (0 = let Agora assign)
 * @param {number} expirySeconds - token lifetime in seconds (default 1 hour)
 */
function generateRtcToken(channelName, uid = 0, expirySeconds = 3600) {
  const expirationTime = Math.floor(Date.now() / 1000) + expirySeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    expirationTime
  );

  return token;
}

module.exports = { generateRtcToken, APP_ID };
