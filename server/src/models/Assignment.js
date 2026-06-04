import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
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
        dueDate: {
            type: Date,
            required: true,
        },
        maxPoints: {
            type: Number,
            default: 100,
        },
        attachments: [{
            originalName: String,
            fileUrl: String, // Pointing to Supabase
            fileType: String,
        }],
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "published",
        }
    },
    {
        timestamps: true,
    }
);

// Indexes
assignmentSchema.index({ classroom: 1, dueDate: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ organization_id: 1 });

export default mongoose.model("Assignment", assignmentSchema);
