import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
    {
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        // For actual turned in file
        submittedFile: {
            originalName: String,
            fileUrl: String, // Pointing to Supabase
            fileType: String,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        // Grading metadata
        grade: {
            type: Number,
            default: null, // Null means ungraded
        },
        feedback: {
            type: String,
            default: "",
        },
        gradedAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["submitted", "returned", "late"],
            default: "submitted",
        }
    },
    {
        timestamps: true,
    }
);

// Indexes
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ classroom: 1, status: 1 });
submissionSchema.index({ organization_id: 1 });

export default mongoose.model("AssignmentSubmission", submissionSchema);
