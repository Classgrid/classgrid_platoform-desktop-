import { getFormSchema } from "./src/services/admissions/admission-form-builder.service.js";

try {
    const schema = getFormSchema({ structure_type: "school_no_div" });
    console.log("SUCCESS:", schema.sections.length);
} catch (e) {
    console.error("CRASH:", e);
}
