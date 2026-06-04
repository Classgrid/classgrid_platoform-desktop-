import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: false // If it's a general or teacher's personal schedule
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Personal timetable
    },
    day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: true
    },
    startTime: {
        type: String, // HH:MM
        required: true
    },
    endTime: {
        type: String, // HH:MM
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    room: {
        type: String,
        default: ""
    },
    teacher: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        enum: ["Lecture", "Lab", "Seminar", "Other"],
        default: "Lecture"
    }
}, { timestamps: true });

const Timetable = mongoose.model("Timetable", timetableSchema);
export default Timetable;
