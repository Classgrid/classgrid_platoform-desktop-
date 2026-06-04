import mongoose from 'mongoose';

const feeRecordSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        title: {
            type: String, // e.g., "Exam Fee Oct 2026", "Lab Monthly Charge"
            required: true,
        },
        category: {
            type: String,
            enum: ['college', 'exam', 'library', 'canteen', 'hostel', 'other'],
            default: 'college',
        },
        amount: {
            type: Number,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'partially_paid', 'paid', 'overdue'],
            default: 'pending',
        },
        paymentReference: String,
        paidAt: Date,
        remarks: String,
    },
    {
        timestamps: true,
    }
);

// Helpful indexes for student and admin dashboard
feeRecordSchema.index({ student: 1, status: 1 });
feeRecordSchema.index({ organizationId: 1, dueDate: 1 });

export default mongoose.model('FeeRecord', feeRecordSchema);
