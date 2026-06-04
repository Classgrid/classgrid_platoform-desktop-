import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Setup environment
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
};

// Simple schema to read old memberships
const classroomMembershipSchema = new mongoose.Schema({
    classroom: String,
    student: String,
    status: String,
    createdAt: Date,
    updatedAt: Date
});
const MongoMembership = mongoose.model('ClassroomMembership', classroomMembershipSchema);

// Supabase client using primary credentials
const supabaseUrl = process.env.SUPABASE_CHAT_URL;
const supabaseKey = process.env.SUPABASE_CHAT_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function migrateMemberships() {
    console.log('Starting migration...');
    await connectDB();

    try {
        // Find all memberships in MongoDB
        const memberships = await MongoMembership.find().lean();
        console.log(`Found ${memberships.length} memberships in MongoDB.`);

        if (memberships.length === 0) {
            console.log('No memberships to migrate. Exiting.');
            process.exit(0);
        }

        let successCount = 0;
        let errorCount = 0;

        for (const [index, mem] of memberships.entries()) {
            if (!mem.classroom || !mem.student) {
               console.warn(`[${index + 1}/${memberships.length}] Skipping corrupted membership: missing student or classroom.`);
               errorCount++;
               continue;    
            }

            // check if it's already in Supabase
            const { data: existing, error: checkErr } = await sb
                .from('classroom_memberships')
                .select('id')
                .eq('classroom_id', mem.classroom.toString())
                .eq('student_id', mem.student.toString())
                .maybeSingle();

            if (checkErr) { // skip error check logging if we can
               console.error(`[${index + 1}/${memberships.length}] Error checking Supabase:`, checkErr.message);
               errorCount++;
               continue;
            }

            if (existing) {
                console.log(`[${index + 1}/${memberships.length}] Skiping ${mem.student} in ${mem.classroom} (Already exists in Supabase)`);
                continue;
            }

            // Insert into Supabase
            const { error: insertErr } = await sb
                .from('classroom_memberships')
                .insert({
                    classroom_id: mem.classroom.toString(),
                    student_id: mem.student.toString(),
                    status: mem.status || 'approved',
                    joined_at: mem.status === 'approved' ? mem.updatedAt || new Date() : null,
                    created_at: mem.createdAt || new Date()
                });

            if (insertErr) {
                console.error(`[${index + 1}/${memberships.length}] ❌ Failed to insert ${mem.student} in ${mem.classroom}:`, insertErr.message);
                errorCount++;
            } else {
                console.log(`[${index + 1}/${memberships.length}] ✅ Migrated ${mem.student} to ${mem.classroom} successfully.`);
                successCount++;
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Total checked: ${memberships.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Fatal Migration Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

migrateMemberships();
