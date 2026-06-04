import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
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
        weekStart: {
            type: Date,
            required: true, // Should be the Monday of the week
        },
        lessons: [
            {
                day: {
                    type: String,
                    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    required: true,
                },
                topic: {
                    type: String,
                    required: true,
                },
                objectives: [String],
                materials: [String],
                homework: {
                    type: String,
                    default: "",
                },
                done: {
                    type: Boolean,
                    default: false,
                }
            }
        ]
    },
    {
        timestamps: true,
    }
);

// One plan per classroom per week
planSchema.index({ classroom: 1, weekStart: 1 }, { unique: true });
planSchema.index({ teacher: 1 });
planSchema.index({ organization_id: 1 });

export default mongoose.model("Plan", planSchema);
