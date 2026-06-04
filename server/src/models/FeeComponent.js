import mongoose from 'mongoose';

const feeComponentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeCategory',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    defaultAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('FeeComponent', feeComponentSchema);
