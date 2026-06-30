import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Organization from "../src/models/Organization.js";

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Simulate the public.routes.js logic
  const slug = null;
  const domainParam = "erp.quantumchem.site";
  const tenantHost = "api.classgrid.in"; // usually what req.tenantHost is

  const query = [];
  if (slug) query.push({ subdomain: slug });
  if (tenantHost) {
    query.push({ "custom_domain.domain": tenantHost });
    query.push({ "erp_domain.domain": tenantHost });
  }
  if (domainParam) {
    query.push({ "custom_domain.domain": domainParam });
    query.push({ "erp_domain.domain": domainParam });
  }

  console.log("Query:", JSON.stringify({ $or: query }, null, 2));

  const org = await Organization.findOne({ $or: query })
    .select("name subdomain logo_url favicon_url campus_photo_url social_links branding status custom_domain erp_domain site_title")
    .lean();
    
  if (!org) {
    console.log("404 - Organization not found");
  } else {
    console.log("Found:", org.name);
    const erpDomain = org.erp_domain;
    const mktDomain = org.custom_domain;
    const activeErpDomain = (erpDomain?.status === "verified" || erpDomain?.status === "active") ? erpDomain?.domain : null;
    const activeMktDomain = (mktDomain?.status === "verified" || mktDomain?.status === "active") ? mktDomain?.domain : null;

    console.log("activeErpDomain:", activeErpDomain);
    console.log("activeMktDomain:", activeMktDomain);
  }
  
  process.exit();
}

test();
