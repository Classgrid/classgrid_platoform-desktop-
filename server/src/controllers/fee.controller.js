import FeeCategory from "../models/FeeCategory.js";
import FeeComponent from "../models/FeeComponent.js";
import FeeStructure from "../models/FeeStructure.js";
import StudentFeeLedger from "../models/StudentFeeLedger.js";
import FeeTransaction from "../models/FeeTransaction.js";
import connectDB from "../../config/db.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// FETCH LEDGER
// ─────────────────────────────────────────────
export const getStudentLedger = async (req, res) => {
    try {
        await connectDB();
        const { studentId } = req.params;
        const { organizationId } = req.user; // Assuming auth middleware provides this

        const ledger = await StudentFeeLedger.findOne({ studentId, organizationId })
            .populate('structureId')
            .populate({
                path: 'installments',
                options: { sort: { 'dueDate': 1 } }
            });

        if (!ledger) {
            return res.status(404).json({ message: "Ledger not found for this student" });
        }

        const transactions = await FeeTransaction.find({ ledgerId: ledger._id }).sort({ paymentDate: -1 });

        res.json({ ledger, transactions });
    } catch (err) {
        console.error("[Fees] Get ledger error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ─────────────────────────────────────────────
// RECORD MANUAL PAYMENT
// ─────────────────────────────────────────────
export const recordPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await connectDB();
        const { studentId, amount, method, remarks, transactionId, upiId } = req.body;
        const { organizationId, _id: adminId } = req.user;

        // 1. Find Ledger
        const ledger = await StudentFeeLedger.findOne({ studentId, organizationId }).session(session);
        if (!ledger) {
            throw new Error("Student fee ledger not found");
        }

        // 2. Create Transaction Record
        const receiptNo = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const transaction = new FeeTransaction({
            ledgerId: ledger._id,
            studentId,
            organizationId,
            amount,
            method,
            methodDetails: { transactionId, upiId },
            receiptNo,
            recordedBy: adminId,
            remarks
        });

        await transaction.save({ session });

        // 3. Update Ledger Installments (FIFO Allocation)
        let remainingAmount = amount;
        for (let installment of ledger.installments) {
            if (remainingAmount <= 0) break;
            
            const due = installment.amount - installment.paidAmount;
            if (due > 0) {
                const allocation = Math.min(remainingAmount, due);
                installment.paidAmount += allocation;
                remainingAmount -= allocation;
                
                if (installment.paidAmount >= installment.amount) {
                    installment.status = 'paid';
                } else if (installment.paidAmount > 0) {
                    installment.status = 'partially_paid';
                }
            }
        }

        ledger.lastPaymentDate = new Date();
        await ledger.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ 
            message: "Payment recorded successfully", 
            transaction,
            balance: ledger.balance 
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("[Fees] Record payment error:", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ─────────────────────────────────────────────
// STUDENT: SUBMIT PAYMENT PROOF (Manual Bank/UPI)
// ─────────────────────────────────────────────
export const submitPaymentProof = async (req, res) => {
    try {
        await connectDB();
        const { ledgerId, amount, method, transactionId, proofUrl, remarks } = req.body;
        const studentId = req.user._id;
        const { organizationId } = req.user;

        const transaction = new FeeTransaction({
            ledgerId,
            studentId,
            organizationId,
            amount,
            method, // 'upi' or 'bank_transfer'
            methodDetails: { transactionId, proofUrl },
            status: 'pending_verification',
            remarks
        });

        await transaction.save();
        res.status(201).json({ message: "Payment proof submitted. Awaiting college verification.", transaction });
    } catch (err) {
        console.error("[Fees] Submit proof error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ─────────────────────────────────────────────
// ADMIN: VERIFY/APPROVE PAYMENT
// ─────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await connectDB();
        const { transactionId, status, verificationRemarks } = req.body; // status: 'success' or 'rejected'
        const { _id: adminId, organizationId } = req.user;

        const transaction = await FeeTransaction.findOne({ _id: transactionId, organizationId }).session(session);
        if (!transaction) throw new Error("Transaction not found");
        if (transaction.status !== 'pending_verification') throw new Error("Transaction is already processed");

        transaction.status = status;
        transaction.verificationRemarks = verificationRemarks;
        transaction.recordedBy = adminId;

        if (status === 'success') {
            const receiptNo = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            transaction.receiptNo = receiptNo;

            // Update Ledger
            const ledger = await StudentFeeLedger.findById(transaction.ledgerId).session(session);
            let remainingAmount = transaction.amount;
            
            for (let installment of ledger.installments) {
                if (remainingAmount <= 0) break;
                const due = installment.amount - installment.paidAmount;
                if (due > 0) {
                    const allocation = Math.min(remainingAmount, due);
                    installment.paidAmount += allocation;
                    remainingAmount -= allocation;
                    installment.status = installment.paidAmount >= installment.amount ? 'paid' : 'partially_paid';
                }
            }
            ledger.lastPaymentDate = new Date();
            await ledger.save({ session });
        }

        await transaction.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.json({ message: `Payment ${status === 'success' ? 'approved' : 'rejected'} successfully`, transaction });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("[Fees] Verify payment error:", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ─────────────────────────────────────────────
// CREATE FEE STRUCTURE
// ─────────────────────────────────────────────
export const createStructure = async (req, res) => {
    try {
        await connectDB();
        const { name, components, academicYear } = req.body;
        const { organizationId } = req.user;

        const totalAmount = components.reduce((acc, curr) => acc + curr.amount, 0);

        const structure = new FeeStructure({
            name,
            organizationId,
            components,
            totalAmount,
            academicYear
        });

        await structure.save();
        res.status(201).json(structure);
    } catch (err) {
        console.error("[Fees] Create structure error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
