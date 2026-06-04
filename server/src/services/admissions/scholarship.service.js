import xlsx from "xlsx";
import AdmissionApplication from "../../models/AdmissionApplication.js";

/**
 * ScholarshipService
 * Handles categorization-based fee structures and bulk scholarship imports.
 */
class ScholarshipService {
    /**
     * Resolves the appropriate FeeStructure ID for an application.
     * Looks at seat_type and category mapping in the organization config.
     * 
     * Priority: 
     * 1. Exact match on seat_type
     * 2. Exact match on category
     * 3. Fallback to default admission_fee_structure_id
     * 
     * @param {Object} application 
     * @param {Object} org 
     * @returns {string} The resolved fee_structure_id
     */
    calculateFeeStructure(application, org) {
        const feeConfig = org.admission_config?.fee_config;
        if (!feeConfig) return null;

        const mappings = feeConfig.dynamic_fee_mapping || [];

        // 1. Try mapping by seat_type (e.g. TFWS)
        const seatTypeMatch = mappings.find(m => 
            m.attribute_type === "seat_type" && 
            m.attribute === application.seat_type
        );
        if (seatTypeMatch) return seatTypeMatch.fee_structure_id;

        // 2. Try mapping by category (e.g. OBC, SC)
        const categoryMatch = mappings.find(m => 
            m.attribute_type === "category" && 
            m.attribute === application.category
        );
        if (categoryMatch) return categoryMatch.fee_structure_id;

        // 3. Fallback to default
        return feeConfig.admission_fee_structure_id;
    }

    /**
     * Process a bulk scholarship/seat-type import.
     * CSV/Excel should have headers: ['en_number' or 'email' or 'phone', 'seat_type', 'category']
     * 
     * @param {string} orgId 
     * @param {Buffer} buffer 
     * @returns {Promise<Object>} { successCount, errors }
     */
    async processScholarshipImport(orgId, buffer) {
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let successCount = 0;
        let errors = [];

        for (const row of data) {
            try {
                // Find application by identity field
                const query = { organization_id: orgId };
                if (row.en_number) query.en_number = row.en_number;
                else if (row.email) query.email = row.email.toLowerCase();
                else if (row.phone) query.phone = row.phone;
                else {
                    errors.push({ row, error: "Missing identity field (en_number/email/phone)" });
                    continue;
                }

                const application = await AdmissionApplication.findOne(query);
                if (!application) {
                    errors.push({ row, error: "Application not found" });
                    continue;
                }

                // Update scholarship attributes
                if (row.seat_type) application.seat_type = row.seat_type;
                if (row.category) application.category = row.category;

                await application.save();
                successCount++;
            } catch (err) {
                errors.push({ row, error: err.message });
            }
        }

        return { successCount, errors };
    }
}

export default new ScholarshipService();
