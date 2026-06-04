import mongoose from "mongoose";

const facultyPayrollSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Period, e.g., "2026-04"
        month: {
            type: String,
            required: true,
        },
        total_working_days: {
            type: Number,
            default: 0,
        },
        present_days: {
            type: Number,
            default: 0,
        },
        absent_days: {
            type: Number,
            default: 0,
        },
        leaves_taken: {
            type: Number,
            default: 0,
        },
        // For hourly workers
        total_hours_worked: {
            type: Number,
            default: 0,
        },
        gross_salary: {
            type: Number,
            default: 0,
        },
        deductions: {
            type: Number,
            default: 0,
        },
        net_salary: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["draft", "locked", "paid"],
            default: "draft",
        },
    },
    { timestamps: true }
);

facultyPayrollSchema.index({ organization: 1, month: 1 });
facultyPayrollSchema.index({ faculty: 1, month: 1 }, { unique: true });

export default mongoose.models.FacultyPayroll ||
    mongoose.model("FacultyPayroll", facultyPayrollSchema);
