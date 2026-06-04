import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = pkg;
import "../../env.js";

const APP_ID = process.env.AGORA_APP_ID || "PLACEHOLDER_APP_ID";
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "PLACEHOLDER_CERTIFICATE";

/**
 * generateRtcToken
 * Generates a secure RTC token for a specific channel (e.g. classroomId).
 * 
 * @param {string} channelName  Classroom or Chat ID
 * @param {string} uid          Numeric UID (Agora requires integers or strings, using string uid here)
 * @param {string} role         'publisher' or 'subscriber'
 * @param {number} expiryTime   How long the token is valid (seconds)
 */
export const generateRtcToken = (channelName, uid, role = 'publisher', expiryTime = 3600) => {
    const privilegeExpireTime = Math.floor(Date.now() / 1000) + expiryTime;
    
    const tokenRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        tokenRole,
        privilegeExpireTime
    );

    return token;
};

/**
 * generateRtmToken
 * Generates a secure RTM (Real-Time Messaging) token for a specific user.
 * Required for signaling, chat, and call-ringing.
 * 
 * @param {string} uid          The user's unique ID
 * @param {number} expiryTime   How long the token is valid (seconds)
 */
export const generateRtmToken = (uid, expiryTime = 3600) => {
    const privilegeExpireTime = Math.floor(Date.now() / 1000) + expiryTime;

    const token = RtmTokenBuilder.buildToken(
        APP_ID,
        APP_CERTIFICATE,
        uid,
        privilegeExpireTime
    );

    return token;
};
