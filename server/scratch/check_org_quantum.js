import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Organization from "../src/models/Organization.js";

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");
  
  const org = await Organization.findOne({
    $or: [
      { "custom_domain.domain": "erp.quantumchem.site" },
      { "erp_domain.domain": "erp.quantumchem.site" },
      { "custom_domain.domain": "quantumchem.site" },
      { "erp_domain.domain": "quantumchem.site" }
    ]
  }).lean();
  
  console.log("Org found:", org ? org.name : "None");
  if (org) {
    console.log("custom_domain:", org.custom_domain);
    console.log("erp_domain:", org.erp_domain);
    console.log("status:", org.status);
    console.log("site_title:", org.site_title);
  }
  
  process.exit();
}

check();
