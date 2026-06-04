import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
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
    components: [{
        componentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FeeComponent',
            required: true
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    academicYear: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('FeeStructure', feeStructureSchema);
