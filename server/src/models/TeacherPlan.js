import mongoose from 'mongoose';

const teacherPlanningSchema = new mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        classroomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classroom',
            required: true,
        },
        weekNumber: {
            type: Number,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        planningType: {
            type: String,
            enum: ['weekly', 'daily'],
            default: 'weekly',
        },
        date: {
            type: Date, // For exact daily plans
        },
        goals: [{
            title: String,
            description: String,
            isCompleted: { type: Boolean, default: false },
            status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' }
        }],
        topicsCovered: [String],
        homeworkAssigned: {
            type: Boolean,
            default: false
        },
        notes: String
    },
    {
        timestamps: true,
    }
);

// Standard indexes for fast dashboard lookups
teacherPlanningSchema.index({ teacher: 1, year: 1, weekNumber: 1 });
teacherPlanningSchema.index({ classroomId: 1, date: 1 });

export default mongoose.model('TeacherPlan', teacherPlanningSchema);
