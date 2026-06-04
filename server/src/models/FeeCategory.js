import mongoose from 'mongoose';

const feeCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    description: String
}, { timestamps: true });

export default mongoose.model('FeeCategory', feeCategorySchema);
