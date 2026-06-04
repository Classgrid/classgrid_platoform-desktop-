import mongoose from 'mongoose';

const NotePackageSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String },
    branch: { type: String },
    price: { type: Number, default: 0 }, // 0 = Free
    fileUrl: { type: String, required: true }, // Main PDF Path
    previewUrls: [{ type: String }], // First 3 pages thumbnails
    summary: { type: String }, // AI Generated
    stats: {
        views: { type: Number, default: 0 },
        sales: { type: Number, default: 0 },
        rating: { type: Number, default: 0 }
    },
    isApproved: { type: Boolean, default: false }, // Moderation layer
    createdAt: { type: Date, default: Date.now }
});

const NotePackage = mongoose.model('NotePackage', NotePackageSchema);
export default NotePackage;
