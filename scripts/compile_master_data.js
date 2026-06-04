import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * compile_master_data.js
 * 
 * Used to convert raw text/CSV data of Indian States, Districts, Talukas, and Demographics
 * into highly optimized hierarchical JSON files for Supabase Buckets.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, 'master_india_geography.csv');
const rawGeographyData = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8') : '';

const compileGeography = () => {
    const lines = rawGeographyData.trim().split('\n');
    const geoTree = {};

    lines.forEach(line => {
        if(line.includes("State,District,Taluka")) return; // skip header
        if(!line.trim()) return;

        const parts = line.split(',').map(s => s.trim());
        if(parts.length < 3) return;

        const [state, district, taluka] = parts;

        if (!geoTree[state]) geoTree[state] = {};
        if (!geoTree[state][district]) geoTree[state][district] = [];
        if (!geoTree[state][district].includes(taluka)) {
            geoTree[state][district].push(taluka);
        }
    });

    const outputPath = path.join(__dirname, 'classgrid_india_geography.json');
    fs.writeFileSync(outputPath, JSON.stringify(geoTree, null, 2));
    console.log(`✅ Compiled Geography Tree saved to ${outputPath}`);
    console.log("Next Step: Upload this file to your Supabase 'classgrid-assets' bucket!");
};

// Run compilers
compileGeography();
