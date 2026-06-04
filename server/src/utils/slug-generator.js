import slugify from 'slugify';
import Organization from '../models/Organization.js';

/**
 * Generates a unique subdomain slug for an organization.
 * e.g. "Pimpri Chinchwad College" -> "pccoe" or "pimpri-chinchwad"
 */
export const generateUniqueSlug = async (name) => {
    let slug = slugify(name, {
        lower: true,
        strict: true,
        trim: true
    });

    // Check availability
    let exists = await Organization.findOne({ subdomain: slug });
    let counter = 1;
    let originalSlug = slug;

    while (exists) {
        slug = `${originalSlug}-${counter}`;
        exists = await Organization.findOne({ subdomain: slug });
        counter++;
    }

    return slug;
};
