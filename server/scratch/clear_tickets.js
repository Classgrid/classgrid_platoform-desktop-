import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import mongoose from "mongoose";
import { primarySupabaseClient } from "../src/config/supabaseClient.js";
import SupportTicket from "../src/models/SupportTicket.js";

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("Deleting all Support Tickets from MongoDB...");
        const result = await SupportTicket.deleteMany({});
        console.log(`Deleted ${result.deletedCount} tickets from MongoDB.`);

        console.log("\nConnecting to Supabase to clear bucket 'support-attachments'...");
        
        // Supabase storage api to list all files
        // We will list all folders at the root and recursively delete
        // Note: Supabase JS library allows removing an array of paths
        
        async function listAllFiles(folderPath = '') {
            let allFiles = [];
            const { data, error } = await primarySupabaseClient.storage
                .from('support-attachments')
                .list(folderPath, {
                    limit: 1000,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' }
                });
                
            if (error) {
                console.error("Error listing files:", error);
                return [];
            }
            
            for (const item of data) {
                const currentPath = folderPath ? `${folderPath}/${item.name}` : item.name;
                // If id is null, it's typically a folder
                if (item.id === null || !item.metadata) {
                    const subFiles = await listAllFiles(currentPath);
                    allFiles = allFiles.concat(subFiles);
                } else {
                    allFiles.push(currentPath);
                }
            }
            return allFiles;
        }

        console.log("Scanning bucket...");
        const filesToDelete = await listAllFiles();
        
        if (filesToDelete.length > 0) {
            console.log(`Found ${filesToDelete.length} files. Deleting...`);
            // Supabase remove takes max 100 items at a time, let's chunk it just in case
            for (let i = 0; i < filesToDelete.length; i += 100) {
                const chunk = filesToDelete.slice(i, i + 100);
                const { data, error } = await primarySupabaseClient.storage
                    .from('support-attachments')
                    .remove(chunk);
                    
                if (error) {
                    console.error("Error removing chunk:", error);
                } else {
                    console.log(`Deleted chunk of ${data.length} files.`);
                }
            }
            console.log("Bucket cleanup complete.");
        } else {
            console.log("Bucket is already empty.");
        }

    } catch (err) {
        console.error("Script failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Done.");
        process.exit(0);
    }
}

run();
