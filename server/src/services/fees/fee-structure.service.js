import FeeStructure from "../../models/FeeStructure.js";

// ══════════════════════════════════════════════════════════════════════════════
// FEE STRUCTURE SERVICE — Pure CRUD business logic for master fee templates.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Creates or updates a Master Fee Structure for a specific batch.
 * Uses an upsert based on hierarchy_id and title to prevent accidental duplicates.
 * 
 * @param {Object} data  - Contains hierarchy_id, title, base_amount, tax_percentage, due_date, line_items.
 * @param {string} orgId - Tenant isolation.
 * @returns {Promise<Object>} The saved FeeStructure document.
 */
export async function createFeeStructure(data, orgId) {
    if (!orgId) throw new Error("orgId is required.");
    const { hierarchy_id, title, base_amount, tax_percentage, due_date, line_items } = data;

    if (!hierarchy_id || !title || base_amount === undefined || !due_date) {
        throw new Error("hierarchy_id, title, base_amount, and due_date are required.");
    }

    if (base_amount < 0) {
        throw new Error("base_amount cannot be negative.");
    }

    try {
        // Upsert to strictly prevent duplicate identical fee structures
        const structure = await FeeStructure.findOneAndUpdate(
            {
                organization_id: orgId,
                hierarchy_id: hierarchy_id,
                title: title.trim()
            },
            {
                base_amount,
                tax_percentage: tax_percentage || 0,
                due_date: new Date(due_date),
                line_items: line_items || []
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        return structure.toObject();
    } catch (error) {
        if (error.code === 11000) {
            throw new Error("A fee structure with this exact title already exists for this batch.");
        }
        throw new Error(`Failed to create fee structure: ${error.message}`);
    }
}

/**
 * Fetches all fee structures for an organization, optionally filtered by hierarchy_id.
 * 
 * @param {string} orgId   - Tenant isolation.
 * @param {Object} filters - Optional filters (e.g., { hierarchy_id }).
 * @returns {Promise<Array>} List of fee structures.
 */
export async function getFeeStructures(orgId, filters = {}) {
    if (!orgId) throw new Error("orgId is required.");

    try {
        const query = { organization_id: orgId };
        
        if (filters.hierarchy_id) {
            query.hierarchy_id = filters.hierarchy_id;
        }

        return await FeeStructure.find(query)
            .populate("hierarchy_id", "name grade section type") // Populate DNA node details for UI
            .sort({ createdAt: -1 })
            .lean();
    } catch (error) {
        throw new Error(`Failed to fetch fee structures: ${error.message}`);
    }
}

/**
 * Modifies an existing fee structure securely.
 * 
 * @param {string} structureId - The FeeStructure._id.
 * @param {Object} data        - Fields to update.
 * @param {string} orgId       - Tenant isolation.
 * @returns {Promise<Object>}  The updated FeeStructure.
 */
export async function updateFeeStructure(structureId, data, orgId) {
    if (!structureId || !orgId) throw new Error("structureId and orgId are required.");

    try {
        // Find and update, ensuring it belongs to this specific orgId
        const updatedStructure = await FeeStructure.findOneAndUpdate(
            { _id: structureId, organization_id: orgId },
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!updatedStructure) {
            throw new Error("Fee structure not found or unauthorized.");
        }

        return updatedStructure.toObject();
    } catch (error) {
        throw new Error(`Failed to update fee structure: ${error.message}`);
    }
}

/**
 * Deletes a master fee structure.
 * 
 * @param {string} structureId - The FeeStructure._id.
 * @param {string} orgId       - Tenant isolation.
 * @returns {Promise<Object>}  The deleted document.
 */
export async function deleteFeeStructure(structureId, orgId) {
    if (!structureId || !orgId) throw new Error("structureId and orgId are required.");

    try {
        const deleted = await FeeStructure.findOneAndDelete({
            _id: structureId,
            organization_id: orgId
        });

        if (!deleted) {
            throw new Error("Fee structure not found or unauthorized.");
        }

        return deleted.toObject();
    } catch (error) {
        throw new Error(`Failed to delete fee structure: ${error.message}`);
    }
}
