import { provisionDemoOrg } from '../services/provisioning.service.js';

/**
 * Super Admin Endpoint: Manually provision a new tenant
 * POST /api/admin/organizations/provision
 */
export const handleManualProvisioning = async (req, res) => {
    try {
        const { admin, organization } = req.body;

        if (!admin?.phone_number || !organization?.name) {
            return res.status(400).json({ message: "Admin phone and Organization name are required." });
        }

        // Only Super Admins can use this internal provisioning tool
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: "Only platform administrators can provision new tenants." });
        }

        const result = await provisionDemoOrg(admin, organization);

        res.status(201).json({
            message: "Tenant provisioned successfully",
            data: result
        });

    } catch (error) {
        console.error("Provisioning Error:", error);
        res.status(500).json({ 
            message: "Provisioning failed", 
            error: error.message 
        });
    }
};

/**
 * Public Endpoint: Self-service demo provisioning
 * POST /api/public/demo/provision
 */
export const handleSelfServiceDemo = async (req, res) => {
    try {
        const { admin, organization } = req.body;

        // Add rate limiting here in production to prevent spam
        
        const result = await provisionDemoOrg({
            ...admin,
            role: 'org_admin'
        }, {
            ...organization,
            org_type: organization.org_type || 'school'
        });

        res.status(201).json({
            message: "Demo institution created. Redirecting to your portal...",
            subdomain: result.organization.subdomain
        });

    } catch (error) {
        console.error("Self-Service Provisioning Error:", error);
        res.status(500).json({ message: "Could not create demo. Please try again later." });
    }
};
