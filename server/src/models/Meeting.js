import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
    {
        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        provider: {
            type: String,
            enum: ["google_meet", "zoom", "webex"],
            required: true,
        },
        topic: {
            type: String,
            required: true,
        },
        join_url: {
            type: String,
            required: true,
        },
        start_time: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number, // in minutes
            default: 60,
        },
        calendar_event_id: {
            type: String, // ID of the event in Google Calendar (optional)
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

meetingSchema.index({ classroom: 1, start_time: 1 });
meetingSchema.index({ teacher: 1, start_time: 1 });
meetingSchema.index({ organization_id: 1 });

export default mongoose.model("Meeting", meetingSchema);
