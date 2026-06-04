import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.CLASSROOM_SUPABASE_URL;
const key = process.env.CLASSROOM_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing CLASSROOM credentials!");
    process.exit(1);
}

const adminClient = createClient(url, key);

async function run() {
    try {
        console.log("Checking if bucket exists in CLASSROOM project...");
        const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
        
        if (listError) {
            console.error("Error listing buckets:", listError);
            return;
        }

        const bucketExists = buckets.some(b => b.name === 'admission-documents');
        if (bucketExists) {
            console.log("Bucket 'admission-documents' already exists.");
            await adminClient.storage.updateBucket('admission-documents', { public: true });
        } else {
            console.log("Creating bucket 'admission-documents'...");
            const { data, error } = await adminClient.storage.createBucket('admission-documents', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
            });

            if (error) {
                console.error("Error creating bucket:", error);
            } else {
                console.log("Bucket created successfully:", data);
            }
        }
    } catch (e) {
        console.error("Exception:", e);
    } finally {
        process.exit(0);
    }
}

run();
