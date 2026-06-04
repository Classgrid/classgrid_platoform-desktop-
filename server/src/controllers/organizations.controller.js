import OrganizationRequest from "../models/OrganizationRequest.js";

export const createOrganization = async (req, res) => {
    try {
        const { name, email, domain, type, city } = req.body;
        
        if (!name || !email || !domain) {
            return res.status(400).json({ success: false, message: "Name, email, and domain are required" });
        }

        const org = await OrganizationRequest.create({
            name,
            email,
            domain,
            type: type || "school",
            city: city || "N/A",
            status: "pending"
        });
        
        res.status(201).json({ success: true, organization: org, message: "Organization created successfully" });
    } catch (err) {
        console.error("Create organization error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getOrganizations = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        const orgs = await OrganizationRequest.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: orgs });
    } catch (err) {
        console.error("Get organizations error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateOrganizationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const org = await OrganizationRequest.findByIdAndUpdate(id, { status }, { new: true });
        
        if (!org) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }
        
        res.json({ success: true, message: `Organization status updated to ${status}`, org });
    } catch (err) {
        console.error("Update organization status error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
