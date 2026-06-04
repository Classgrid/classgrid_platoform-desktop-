import express from "express";
import { google } from "googleapis";
import { isAuthenticated, requireRole } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import Classroom from "../models/Classroom.js";
import connectDB from "../../config/db.js";
import { primarySupabaseClient as supabase } from "../config/supabaseClient.js";

const router = express.Router();

// Helper to get OAuth2 Client
const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.BACKEND_URL}/api/calendar/callback`
    );
};

// ─────────────────────────────────────────────
// 1. GENERATE OAUTH URL (Redirect User to Google)
// ─────────────────────────────────────────────
router.get("/connect", isAuthenticated, (req, res) => {
    const oauth2Client = getOAuth2Client();
    
    // Scopes needed for Calendar, Meet, and Classroom
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Required to get a refresh token
        prompt: 'consent',      // Force consent screen to guarantee refresh token is provided
        scope: scopes,
        state: req.user._id.toString() // Pass user ID through state param to know who this is when they return
    });

    res.json({ url });
});

// ─────────────────────────────────────────────
// 2. HANDLE OAUTH CALLBACK
// ─────────────────────────────────────────────
router.get("/callback", async (req, res) => {
    try {
        await connectDB();
        const { code, state: userId } = req.query;

        if (!code || !userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/settings?error=calendar_sync_failed`);
        }

        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        // Update the user with the tokens
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/settings?error=user_not_found`);
        }

        user.google_access_token = tokens.access_token;
        if (tokens.refresh_token) {
            user.google_refresh_token = tokens.refresh_token; 
        }
        if (tokens.expiry_date) {
            user.google_token_expiry = new Date(tokens.expiry_date);
        }

        await user.save();

        // Redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL}/assignments?google_connected=true`);
    } catch (err) {
        console.error("Calendar Callback Error:", err);
        res.redirect(`${process.env.FRONTEND_URL}/assignments?google_error=true`);
    }
});

// ─────────────────────────────────────────────
// 3. DISCONNECT ACCOUNT (Clear Tokens)
// ─────────────────────────────────────────────
router.post("/disconnect", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.google_access_token = undefined;
        user.google_refresh_token = undefined;
        user.google_token_expiry = undefined;
        await user.save();

        res.json({ success: true, message: "Google account disconnected" });
    } catch (err) {
        console.error("Calendar Disconnect Error:", err);
        res.status(500).json({ message: "Failed to disconnect Google account" });
    }
});
// 3. SCHEDULE GOOGLE MEET (Teacher Only)
// ─────────────────────────────────────────────
router.post("/meet", isAuthenticated, requireRole("faculty", "org_admin"), async (req, res) => {
    try {
        await connectDB();
        const { classroomId, topic, startTime, durationMinutes } = req.body;

        // Ensure user has connected Google Calendar
        if (!req.user.google_access_token || !req.user.google_refresh_token) {
            return res.status(403).json({ message: "Google Calendar not connected. Please connect your account first." });
        }

        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).json({ message: "Classroom not found" });

        // Setup OAuth Client with User's keys
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: req.user.google_access_token,
            refresh_token: req.user.google_refresh_token,
            expiry_date: req.user.google_token_expiry ? req.user.google_token_expiry.getTime() : null
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const startDate = new Date(startTime);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

        // 📧 Fetch all approved student emails to add as Calendar attendees
        const { default: ClassroomMembership } = await import("../models/ClassroomMembership.js");
        const members = await ClassroomMembership.find({ classroom: classroomId, status: "approved" }).select("student").lean();
        const memberIds = members.map(m => m.student);
        const memberUsers = await User.find({ _id: { $in: memberIds } }).select("_id email pushNotifications").lean();
        
        // Build attendees list for Google Calendar (students get automatic phone notifications!)
        const attendees = memberUsers
            .filter(u => u.email) // Only users with valid emails
            .map(u => ({ email: u.email }));

        // Create Calendar Event with Meet link + student attendees
        const event = {
            summary: `ClassGrid Live: ${classroom.name || classroom.subject} - ${topic}`,
            description: `Live session for ${topic}\n\nJoin via ClassGrid: ${process.env.FRONTEND_URL}/classroom/${classroomId}/liveclass`,
            start: {
                dateTime: startDate.toISOString(),
                timeZone: "Asia/Kolkata", 
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: "Asia/Kolkata",
            },
            conferenceData: {
                createRequest: {
                    requestId: `cg-meet-${Date.now()}`,
                    conferenceSolutionKey: { type: "hangoutsMeet" }
                }
            },
            // 🔔 Add students as attendees — they get Google Calendar notifications on their phones!
            attendees: attendees.length > 0 ? attendees : undefined,
            // Don't send individual invite emails (Calendar handles notifications automatically)
            guestsCanModify: false,
            guestsCanInviteOthers: false,
        };

        const response = await calendar.events.insert({
            calendarId: "primary",
            resource: event,
            conferenceDataVersion: 1, // Required to generate the Meet link
            sendUpdates: "all" // Send calendar invites to all attendees
        });

        const createdEvent = response.data;
        const meetLink = createdEvent.hangoutLink;

        if (!meetLink) {
            throw new Error("Google API did not return a Meet link");
        }

        // Save to our Local Postgres Database
        const { data: meeting, error: meetError } = await supabase
            .from('meetings')
            .insert([{
                classroom_id: classroomId,
                teacher_id: req.user._id.toString(),
                provider: "google_meet",
                topic: topic,
                join_url: meetLink,
                start_time: startDate.toISOString(),
                duration: durationMinutes,
                calendar_event_id: createdEvent.id
            }])
            .select()
            .single();

        if (meetError) {
             console.error("Supabase insert error:", meetError);
             throw new Error("Failed to save meeting track in database.");
        }

        // 🔔 Notify students via Supabase (reuse already-fetched memberUsers)
        try {
            const notifications = [];
            for (const u of memberUsers) {
                if (u.pushNotifications?.global !== false) {
                    notifications.push({
                        recipient_id: u._id.toString(),
                        type: "meeting_reminder",
                        title: "📅 Live Class Scheduled",
                        message: `A new live class "${topic}" is scheduled in ${classroom.name || 'your classroom'}. Check your Google Calendar for the invite!`,
                        link: `/view-classroom?id=${classroomId}#liveclass`,
                        classroom_id: classroomId,
                        related_id: meeting.id.toString()
                    });
                }
            }
            
            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
            }
        } catch (notifErr) {
            console.error("[GoogleMeet] Notification error:", notifErr.message);
        }

        res.json({ message: "Meeting scheduled", meeting: { ...meeting, _id: meeting.id } });

    } catch (err) {
        console.error("Schedule meet error:", err);
        res.status(500).json({ message: "Failed to schedule Google Meet", error: err.message });
    }
});

// ─────────────────────────────────────────────
// 4. CANCEL GOOGLE MEET
// ─────────────────────────────────────────────
router.delete("/meet/:id", isAuthenticated, requireRole("faculty", "org_admin"), async (req, res) => {
    try {
        await connectDB();
        const meetingId = req.params.id;

        // Ensure user has connected Google Calendar
        if (!req.user.google_access_token || !req.user.google_refresh_token) {
            return res.status(403).json({ message: "Google Calendar not connected. Please connect your account first." });
        }

        // Fetch the meeting to get the Google Calendar Event ID
        const { data: meeting, error: fetchError } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();

        if (fetchError || !meeting) {
            return res.status(404).json({ message: "Meeting not found in database." });
        }

        // Check ownership (only the teacher who created it can delete it)
        if (meeting.teacher_id !== req.user._id.toString() && req.user.role !== 'org_admin') {
            return res.status(403).json({ message: "Not authorized to delete this meeting." });
        }

        // Call Google API to delete meeting
        if (meeting.calendar_event_id) {
            const oauth2Client = getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: req.user.google_access_token,
                refresh_token: req.user.google_refresh_token,
                expiry_date: req.user.google_token_expiry ? req.user.google_token_expiry.getTime() : null
            });

            const calendar = google.calendar({ version: "v3", auth: oauth2Client });

            try {
                await calendar.events.delete({
                    calendarId: "primary",
                    eventId: meeting.calendar_event_id
                });
            } catch (calError) {
                // We won't block the database deletion if Google says it's already deleted (404)
                if (calError.code !== 404) {
                    console.error("Google API deletion error:", calError);
                    // Decide if you want to throw here, but usually it's better to continue and delete from local DB
                }
            }
        }

        // Delete from our Local Postgres Database
        const { error: deleteError } = await supabase
            .from('meetings')
            .delete()
            .eq('id', meetingId);

        if (deleteError) {
             console.error("Supabase delete error:", deleteError);
             throw new Error("Failed to remove meeting from local database.");
        }

        res.json({ message: "Meeting cancelled successfully" });

    } catch (err) {
        console.error("Cancel meet error:", err);
        res.status(500).json({ message: "Failed to cancel Google Meet", error: err.message });
    }
});

// ─────────────────────────────────────────────
// 5. DISCONNECT GOOGLE CALENDAR
// ─────────────────────────────────────────────
router.post("/disconnect", isAuthenticated, async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.google_access_token = null;
        user.google_refresh_token = null;
        user.google_token_expiry = null;
        await user.save();

        res.json({ message: "Google Calendar disconnected" });
    } catch (err) {
        console.error("Disconnect error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
