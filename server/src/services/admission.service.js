import mongoose from 'mongoose';
import AdmissionApplication from '../models/AdmissionApplication.js';

/**
 * Retrieves the admissions dashboard data with pagination and filters.
 * Populates hierarchy_id to expose the precise Target Classroom DNA (Course/Branch/Standard)
 * ensuring 4x2 capabilities can dynamically render terminology.
 * 
 * @param {string} orgId 
 * @param {Object} filters - Includes status, search, page, limit
 * @returns {Object} { applications, pagination }
 */
export async function getAdmissionsDashboard(orgId, filters = {}) {
    const { status, search, page = 1, limit = 20 } = filters;
    const query = { organization_id: orgId, is_deleted: false };
    
    if (status && status !== 'all') {
        query.status = status;
    }

    if (search) {
        query.$or = [
            { full_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { en_number: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const applications = await AdmissionApplication.find(query)
        .populate('hierarchy_id')
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(Number(limit))
        .lean();

    const total = await AdmissionApplication.countDocuments(query);

    return {
        applications,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
}

/**
 * Fetches a single complete application with all demographic data,
 * documents, and hierarchy details.
 * 
 * @param {string} applicationId 
 * @returns {Object} application details
 */
export async function getApplicationDetails(applicationId) {
    const application = await AdmissionApplication.findById(applicationId)
        .populate('hierarchy_id')
        .populate('stage_history.changed_by', 'full_name email')
        .populate('application_logs.performed_by', 'full_name email')
        .lean();

    if (!application) {
        throw new Error('Admission application not found.');
    }

    return application;
}

/**
 * Updates the admission status and appends a detailed tracking log
 * to both stage_history and application_logs.
 * 
 * @param {string} applicationId 
 * @param {string} newStatus 
 * @param {string} reviewNotes 
 * @param {string} adminUserId - Optional user ID of the admin making the change
 * @returns {Object} updated application
 */
export async function updateApplicationStatus(applicationId, newStatus, reviewNotes, adminUserId = null) {
    const application = await AdmissionApplication.findById(applicationId);
    
    if (!application) {
        throw new Error('Admission application not found.');
    }

    application.status = newStatus;
    
    // Add to stage history
    application.stage_history.push({
        status: newStatus,
        changed_by: adminUserId,
        comment: reviewNotes || `Status manually changed to ${newStatus}`
    });

    // Add to overarching application audit logs
    application.application_logs.push({
        action: `status_updated_to_${newStatus}`,
        performed_by: adminUserId,
        notes: reviewNotes || ''
    });

    await application.save();

    // Return plain JS object
    return application.toObject();
}
