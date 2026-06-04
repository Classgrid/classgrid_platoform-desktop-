import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pincodes from 'indian-pincodes';

/**
 * auto_fetch_india.js
 * 
 * Automatically generates the entire geography of India (State -> District -> SubDistricts)
 * completely offline using the Indian Pincodes database. No internet or API needed!
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildGeography = () => {
    console.log("Starting full India Geographic compilation...");
    const allData = pincodes.getAllPincodes();
    const geoTree = {};

    allData.forEach(entry => {
        const state = entry.state;
        const district = entry.district;
        const subDistrict = entry.division || entry.name; // Division maps closely to Taluka/Suboffice

        if (!state || !district || !subDistrict) return;

        if (!geoTree[state]) geoTree[state] = {};
        if (!geoTree[state][district]) geoTree[state][district] = [];
        if (!geoTree[state][district].includes(subDistrict)) {
            geoTree[state][district].push(subDistrict);
        }
    });

    const outputPath = path.join(__dirname, 'classgrid_india_geography.json');
    fs.writeFileSync(outputPath, JSON.stringify(geoTree, null, 2));

    console.log(`✅ Compilation 100% complete!`);
    console.log(`✅ Output saved to: ${outputPath}`);
    console.log(`Next Action: Upload classgrid_india_geography.json to Supabase!`);
};

buildGeography();
