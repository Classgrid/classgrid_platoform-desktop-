import { generateRtcToken } from '../services/agora.service.js';
import { io } from '../services/socket.service.js';

/**
 * POST /api/call/initiate
 * Notifies participants of an incoming call and provides the Agora token.
 */
export const initiateCall = async (req, res) => {
    try {
        const { channelName, participants, callType } = req.body; // callType: 'video' | 'voice'
        const callerId = req.user._id.toString();

        if (!channelName || !participants || !participants.length) {
            return res.status(400).json({ error: "Missing required call parameters" });
        }

        // Generate token for the caller
        const token = generateRtcToken(channelName, callerId, 'publisher');

        // Signaling: Notify each participant via Socket.io
        participants.forEach(participantId => {
            // We assume socket.service.js has a way to get recipient sockets or uses room-based signaling
            // For now, we broadcast to a 'user_ signaling room
            io.to(`user_${participantId}`).emit('INCOMING_CALL', {
                caller: {
                    id: callerId,
                    name: req.user.name,
                    avatar: req.user.avatar
                },
                channelName,
                callType,
                token: generateRtcToken(channelName, participantId, 'publisher') // Token for the recipient
            });
        });

        res.json({
            success: true,
            channelName,
            token
        });
    } catch (err) {
        console.error("[Call] Initiate Error:", err);
        res.status(500).json({ error: "Failed to initiate call" });
    }
};
