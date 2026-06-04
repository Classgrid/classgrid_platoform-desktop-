// Plan Config - single paid product. Pricing is decided outside code later.
const PAID_PLAN = {
    id: "paid",
    label: "Paid",
    priceINR: null,
    studentLimit: 999999,
    maxFaculty: 999,
    features: ["all"],
    storageGB: 1000,
    support: "priority",
};

export const PLANS = {
    PAID: PAID_PLAN,
    STANDARD: PAID_PLAN,
};

export const normalizePlan = () => "PAID";
export const PLAN_RANK = { PAID: 1, STANDARD: 1 };
export const planHasFeature = () => true;

// Mock functions to avoid breaking missing imports
export const getStudentLimit = () => 999999;
export const getMaxStudentsPerClassroom = () => 999999;
export const getMaxClassroomsPerFaculty = () => 999999;
export const getMaxFaculty = () => 999999;
export const getEffectivePlan = () => 'PAID';

export const PAYMENT_CONFIG = {
    upiId: "legacy@upi",
    qrImageUrl: "",
};
