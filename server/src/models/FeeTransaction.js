import mongoose from 'mongoose';

const feeTransactionSchema = new mongoose.Schema({
    ledgerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentFeeLedger',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    method: {
        type: String,
        enum: ['cash', 'upi', 'bank_transfer', 'gateway'],
        required: true
    },
    methodDetails: {
        transactionId: String,
        bankName: String,
        upiId: String,
        gatewayRef: String,
        proofUrl: String // URL to screenshot in Supabase Storage
    },
    receiptNo: {
        type: String,
        unique: true,
        sparse: true // Allow null for pending transactions
    },
    status: {
        type: String,
        enum: ['success', 'pending_verification', 'rejected', 'failed'],
        default: 'success'
    },
    verificationRemarks: String,
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    remarks: String
}, { timestamps: true });


export default mongoose.model('FeeTransaction', feeTransactionSchema);
