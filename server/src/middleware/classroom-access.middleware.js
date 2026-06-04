import Classroom from "../models/Classroom.js";
import { getChatSb } from "../config/supabaseClient.js";

/**
 * Ensures a student can only access or join classrooms that belong to their explicitly assigned division.
 * Older "generic" classrooms (without a division_id) are bypassed.
 */
export const enforceClassroomAccess = async (req, res, next) => {
    try {
        // Teachers/Admins are allowed to bypass strict division checks
        if (req.user.role !== 'student') {
            return next();
        }

        // Identify the target classroom from params (join by link/click) or body (join by code)
        let targetClassroom = null;
        if (req.params.id) {
            targetClassroom = await Classroom.findById(req.params.id);
        } else if (req.body.classroomId) {
            targetClassroom = await Classroom.findById(req.body.classroomId);
        } else if (req.body.classCode) {
            targetClassroom = await Classroom.findOne({ classCode: req.body.classCode.toUpperCase().trim() });
        }

        // If classroom isn't found, let the main controller handle the 404
        if (!targetClassroom) {
            return next();
        }

        // If the classroom isn't linked to the new ERP structure (legacy), bypass check
        if (!targetClassroom.division_id) {
            return next();
        }

        // Fetch the student's assigned division from the 'students' table in Supabase
        const { data: studentRecord, error } = await getChatSb()
            .from('students')
            .select('division_id')
            .eq('user_id', req.user._id.toString())
            .single();

        if (error || !studentRecord) {
            return res.status(403).json({
                message: "We could not find your student record. Please contact your administrator.",
                code: "STUDENT_RECORD_MISSING"
            });
        }

        if (!studentRecord.division_id) {
            return res.status(403).json({
                message: "You have not been assigned to an academic division yet. Please wait for assignment.",
                code: "NO_DIVISION_ASSIGNED"
            });
        }

        // STRICT ENFORCEMENT
        if (studentRecord.division_id !== targetClassroom.division_id) {
            return res.status(403).json({
                message: "You are not assigned to this classroom's division. Access blocked.",
                code: "DIVISION_MISMATCH"
            });
        }

        // Passed checks
        next();
    } catch (err) {
        console.error("Access Control Middleware Error:", err);
        res.status(500).json({ message: "Server error verifying classroom access" });
    }
};
