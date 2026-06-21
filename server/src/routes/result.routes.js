import express from 'express';
import { isAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { attachInstitutionProfile } from '../middleware/institution-profile.middleware.js';
import { getChatSb } from '../config/supabaseClient.js';
import User from '../models/User.js';

const router = express.Router();
router.use(isAuthenticated, attachInstitutionProfile({ required: false }));

router.get('/institution-profile', attachInstitutionProfile(), (req, res) => {
    res.json({
        institution_profile: req.institutionProfile,
        examination_profile: req.institutionProfile.examinationProfile,
        learner_record_profile: req.institutionProfile.learnerRecordProfile,
    });
});

const getSb = (req) => {
    const sb = getChatSb();
    const orgId = req.effectiveOrganizationId || req.user.organization_id?.toString();
    return { sb, orgId };
};

// ======================================================
// CONCURRENT LOCK + BATCH HELPER
// ======================================================
const generatingSchemes = new Map();

async function batchUpsert(sb, table, rows, onConflict, chunkSize = 1000) {
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await sb.from(table).upsert(chunk, { onConflict, ignoreDuplicates: false });
        if (error) throw error;
    }
}

// ======================================================
// DYNAMIC RULE HELPERS (all from rules_json)
// ======================================================

/**
 * FULL rules_json schema (org admin sets everything):
 * {
 *   mode: "college" | "school",
 *
 *   // --- GRADE ---
 *   pass_percentage: 40,
 *   compartment_threshold: 2,
 *   grace_marks: 5,
 *   absent_counts_as_zero: true,
 *   include_all_subjects: true,
 *   best_of_n: null,
 *
 *   // --- GRADE SCALE ---
 *   grade_scale: [
 *     { min: 90, grade: "O",  points: 10 },
 *     { min: 75, grade: "A+", points: 9  },
 *     ...
 *     { min: 0,  grade: "F",  points: 0  }
 *   ],
 *
 *   // --- EXTENDED STATUS (Phase 2) ---
 *   status_rules: [
 *     { min_pct: 75, status: "distinction" },
 *     { min_pct: 60, status: "first_class" },
 *     { min_pct: 50, status: "higher_second_class" },
 *     { min_pct: 40, status: "pass" }
 *   ],
 *
 *   // --- NORMALIZATION ---
 *   normalization: { enabled: false, internal_max: 30, external_max: 70, normalize_to: 100 },
 *
 *   // --- SCHOOL MODE ---
 *   term_weights: { term1: 0.4, term2: 0.6 },
 *
 *   // --- CGPA to PERCENTAGE ---
 *   cgpa_to_percentage: { enabled: true, multiplier: 9.5 }
 * }
 */

function getGradeAndPoints(pct, rules) {
    for (const g of (rules.grade_scale || [])) {
        if (pct >= g.min) return { grade: g.grade, points: g.points ?? 0 };
    }
    return { grade: 'F', points: 0 };
}

// Grace: bump near-fail students to pass threshold
function applyGrace(obtained, threshold, grace) {
    if (!grace || grace <= 0 || obtained >= threshold) return obtained;
    if (obtained >= threshold - grace) return threshold;
    return obtained;
}

// Normalization: internal + external scaled
function normalizeMarks(mark, norm) {
    if (!norm?.enabled) return mark.marks_obtained;
    const total = (norm.internal_max || 0) + (norm.external_max || 0);
    const raw = (mark.internal_marks || 0) + (mark.external_marks || 0);
    return norm.normalize_to ? (raw / total) * norm.normalize_to : raw;
}

// Phase 2: Extended status — STRICT PRIORITY: fail > compartment > distinction > first_class > pass
function computeStatus(percentage, failedCount, compartmentThreshold, rules) {
    // #2 FIX: Fail/compartment ALWAYS override, even at 80%+
    if (failedCount > compartmentThreshold) return 'fail';
    if (failedCount > 0) return 'compartment';

    // Only apply extended status_rules if ALL subjects passed
    const statusRules = rules.status_rules;
    if (statusRules && Array.isArray(statusRules) && statusRules.length > 0) {
        // Always sort DESC by min_pct for correct priority
        const sorted = [...statusRules].sort((a, b) => b.min_pct - a.min_pct);
        for (const rule of sorted) {
            if (percentage >= (rule.min_pct ?? 0)) return rule.status;
        }
    }
    return 'pass';
}

// Phase 2: Ranking with ties (1,1,3 format)
function computeRanking(results) {
    // #1 FIX: Round percentage to 2 decimals BEFORE ranking to prevent floating-point ties
    results.forEach(r => { r.percentage = Math.round(r.percentage * 100) / 100; });
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
    let rank = 1;
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i].percentage < sorted[i - 1].percentage) {
            rank = i + 1; // Skip ranks for ties (1,1,3)
        }
        sorted[i].scheme_rank = rank;
    }
    return sorted;
}


// ======================================================
// SCHEME MANAGEMENT
// ======================================================

router.get('/schemes', isAuthenticated, requireRole('org_admin', 'teacher'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { data, error } = await sb
            .from('result_schemes')
            .select('*, result_subjects(count)')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ schemes: data });
    } catch (err) {
        console.error('[Result Schemes GET]:', err);
        res.status(500).json({ message: 'Failed to fetch schemes' });
    }
});

router.post('/schemes', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { id, name, academic_year, semester, division_id, rules_json } = req.body;

        if (!name) return res.status(400).json({ message: 'Scheme name is required' });

        const defaultRules = {
            mode: 'college',
            pass_percentage: 40,
            compartment_threshold: 2,
            grace_marks: 0,
            absent_counts_as_zero: true,
            include_all_subjects: true,
            best_of_n: null,
            normalization: { enabled: false, internal_max: 30, external_max: 70, normalize_to: 100 },
            term_weights: { term1: 0.4, term2: 0.6 },
            cgpa_to_percentage: { enabled: false, multiplier: 9.5 },
            status_rules: [
                { min_pct: 75, status: 'distinction' },
                { min_pct: 60, status: 'first_class' },
                { min_pct: 50, status: 'higher_second_class' },
                { min_pct: 40, status: 'pass' }
            ],
            grade_scale: [
                { min: 90, grade: 'O',  points: 10 },
                { min: 75, grade: 'A+', points: 9  },
                { min: 60, grade: 'A',  points: 8  },
                { min: 50, grade: 'B+', points: 7  },
                { min: 45, grade: 'B',  points: 6  },
                { min: 40, grade: 'C',  points: 5  },
                { min: 0,  grade: 'F',  points: 0  }
            ]
        };

        // #5 FIX: Validate status_rules before saving
        const finalRules = rules_json || defaultRules;
        if (finalRules.status_rules && Array.isArray(finalRules.status_rules)) {
            // Sort descending by min_pct
            finalRules.status_rules.sort((a, b) => b.min_pct - a.min_pct);
            // Validate percentages 0–100
            for (const sr of finalRules.status_rules) {
                if (sr.min_pct < 0 || sr.min_pct > 100) {
                    return res.status(400).json({ message: `Invalid status rule: min_pct ${sr.min_pct} must be 0–100` });
                }
            }
        }

        const payload = {
            org_id: orgId,
            name: name.trim(),
            academic_year: academic_year || '',
            semester: semester || '',
            division_id: division_id || null,
            rules_json: finalRules,
            created_by: req.user._id.toString()
        };

        let result;
        if (id) {
            const { data, error } = await sb.from('result_schemes').update(payload).eq('id', id).eq('org_id', orgId).select().single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await sb.from('result_schemes').insert(payload).select().single();
            if (error) throw error;
            result = data;
        }
        res.json({ message: 'Scheme saved', scheme: result });
    } catch (err) {
        console.error('[Result Scheme POST]:', err);
        res.status(500).json({ message: 'Failed to save scheme' });
    }
});

router.delete('/schemes/:id', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { data: scheme } = await sb.from('result_schemes').select('status').eq('id', req.params.id).eq('org_id', orgId).single();
        if (scheme?.status === 'locked') return res.status(403).json({ message: 'Locked schemes cannot be deleted' });
        await sb.from('result_schemes').delete().eq('id', req.params.id).eq('org_id', orgId);
        res.json({ message: 'Scheme deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete scheme' });
    }
});

// ======================================================
// SUBJECTS
// ======================================================

router.get('/schemes/:id/subjects', isAuthenticated, async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { data, error } = await sb.from('result_subjects').select('*')
            .eq('scheme_id', req.params.id).eq('org_id', orgId).order('created_at');
        if (error) throw error;
        res.json({ subjects: data });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
});

router.post('/schemes/:id/subjects', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { subjects } = req.body;
        if (!Array.isArray(subjects) || subjects.length === 0) return res.status(400).json({ message: 'Subjects array required' });

        const { data: scheme } = await sb.from('result_schemes').select('status').eq('id', req.params.id).eq('org_id', orgId).single();
        if (scheme?.status === 'locked') return res.status(403).json({ message: 'Scheme is locked' });

        await sb.from('result_subjects').delete().eq('scheme_id', req.params.id).eq('org_id', orgId);

        const VALID_TYPES = ['THEORY', 'LAB', 'ELECTIVE'];
        const insertData = subjects.map(s => ({
            scheme_id: req.params.id,
            org_id: orgId,
            subject_code: s.subject_code || '',
            subject_name: s.subject_name.trim(),
            course_type: VALID_TYPES.includes(s.course_type) ? s.course_type : 'THEORY',
            max_marks: parseInt(s.max_marks) || 100,
            pass_marks: s.pass_marks ? parseInt(s.pass_marks) : null,
            credits: parseInt(s.credits) || 2
        }));

        const { data, error } = await sb.from('result_subjects').insert(insertData).select();
        if (error) throw error;
        res.json({ message: 'Subjects saved', subjects: data });
    } catch (err) {
        console.error('[Result Subjects POST]:', err);
        res.status(500).json({ message: 'Failed to save subjects' });
    }
});

// ======================================================
// MARKS UPLOAD
// ======================================================

router.post('/schemes/:id/upload-marks', isAuthenticated, requireRole('org_admin', 'teacher'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const schemeId = req.params.id;
        const { rows } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: 'No rows provided' });

        const { data: schemeCheck } = await sb.from('result_schemes').select('status, rules_json').eq('id', schemeId).eq('org_id', orgId).single();
        if (schemeCheck?.status === 'locked') return res.status(403).json({ message: 'Scheme is locked' });

        const norm = schemeCheck?.rules_json?.normalization;

        const { data: subjects, error: subjErr } = await sb.from('result_subjects').select('*').eq('scheme_id', schemeId).eq('org_id', orgId);
        if (subjErr) throw subjErr;
        if (!subjects?.length) return res.status(400).json({ message: 'Add subjects first' });

        const subjectMap = {};
        subjects.forEach(s => { subjectMap[s.subject_name.toLowerCase()] = s; });

        const prns = rows.map(r => r.prn || r.PRN || r['Roll No']).filter(Boolean);
        const students = await User.find({
            $or: [{ prn: { $in: prns } }, { roll_no: { $in: prns } }],
            organization_id: req.user.organization_id
        }, 'name prn roll_no _id').lean();

        const studentByPrn = {};
        students.forEach(s => {
            if (s.prn) studentByPrn[s.prn.toLowerCase()] = s;
            if (s.roll_no) studentByPrn[String(s.roll_no).toLowerCase()] = s;
        });

        const marksToInsert = [];
        const errors = [];
        let successCount = 0;

        for (const row of rows) {
            const prn = String(row.prn || row.PRN || row['Roll No'] || '').trim().toLowerCase();
            const student = studentByPrn[prn];
            if (!student) { errors.push({ prn, reason: 'Student not found' }); continue; }

            let rowValid = true;
            for (const [col, val] of Object.entries(row)) {
                if (['prn', 'roll no', 'name'].includes(col.toLowerCase())) continue;
                const subject = subjectMap[col.trim().toLowerCase()];
                if (!subject) continue;

                const rawVal = String(val || '').trim().toLowerCase();
                const isAbsent = !rawVal || rawVal === 'ab' || rawVal === 'absent';
                const marksObtained = isAbsent ? null : parseFloat(val);

                if (!isAbsent && (isNaN(marksObtained) || marksObtained < 0)) {
                    errors.push({ prn, reason: `Invalid marks for ${col}: "${val}"` });
                    rowValid = false; break;
                }
                if (!isAbsent && marksObtained > subject.max_marks) {
                    errors.push({ prn, reason: `${col} exceeds max (${subject.max_marks})` });
                    rowValid = false; break;
                }

                marksToInsert.push({
                    scheme_id: schemeId,
                    subject_id: subject.id,
                    org_id: orgId,
                    student_id: student._id.toString(),
                    marks_obtained: isAbsent ? null : marksObtained,
                    is_absent: isAbsent
                });
            }
            if (rowValid) successCount++;
        }

        if (marksToInsert.length > 0) {
            await batchUpsert(sb, 'result_marks', marksToInsert, 'scheme_id, subject_id, student_id', 1000);
        }
        res.json({ success: successCount, failed: errors.length, errors });
    } catch (err) {
        console.error('[Upload Marks Error]:', err);
        res.status(500).json({ message: 'Failed to upload marks' });
    }
});

// ======================================================
// RESULT ENGINE - GENERATE (School + College, Phase 2)
// ======================================================

router.post('/schemes/:id/generate', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    const { sb, orgId } = getSb(req);
    const schemeId = req.params.id;

    if (generatingSchemes.get(schemeId)) {
        return res.status(409).json({ message: 'Already generating. Please wait.' });
    }
    generatingSchemes.set(schemeId, true);
    const startTime = Date.now();

    try {
        const { data: scheme, error: schErr } = await sb
            .from('result_schemes').select('*').eq('id', schemeId).eq('org_id', orgId).single();
        if (schErr || !scheme) return res.status(404).json({ message: 'Scheme not found' });
        if (scheme.status === 'locked') return res.status(403).json({ message: 'Scheme is locked' });
        if (scheme.is_generating) {
            return res.status(409).json({ message: 'Generation in progress (DB lock). Wait and retry.' });
        }

        await sb.from('result_schemes').update({ is_generating: true }).eq('id', schemeId);

        // ======== ALL CONFIG FROM rules_json ========
        const rules                = scheme.rules_json;
        const mode                 = rules.mode || 'college';
        const passPercentage       = rules.pass_percentage       ?? 40;
        const compartmentThreshold = rules.compartment_threshold ?? 2;
        const graceMarks           = rules.grace_marks           ?? 0;
        const absentCountsAsZero   = rules.absent_counts_as_zero ?? true;
        const includeAllSubjects   = rules.include_all_subjects  ?? true;
        const bestOfN              = rules.best_of_n             ?? null;
        const norm                 = rules.normalization         ?? { enabled: false };
        const cgpaConv             = rules.cgpa_to_percentage    ?? { enabled: false, multiplier: 9.5 };

        const { data: subjects, error: sErr } = await sb
            .from('result_subjects').select('*').eq('scheme_id', schemeId);
        if (sErr) throw sErr;
        if (!subjects?.length) return res.status(400).json({ message: 'No subjects found' });

        const subjectById = {};
        subjects.forEach(s => { subjectById[s.id] = s; });

        const { data: allMarks, error: marksErr } = await sb
            .from('result_marks').select('*').eq('scheme_id', schemeId).eq('org_id', orgId);
        if (marksErr) throw marksErr;
        if (!allMarks?.length) return res.status(400).json({ message: 'No marks uploaded' });

        // Hard limit
        const uniqueStudents = new Set(allMarks.map(m => m.student_id)).size;
        if (uniqueStudents > 6000) {
            await sb.from('result_schemes').update({ is_generating: false }).eq('id', schemeId);
            return res.status(400).json({ message: `${uniqueStudents} students exceeds 6,000 limit. Split by division.` });
        }

        // Group by student
        const studentMarksMap = {};
        for (const mark of allMarks) {
            if (!studentMarksMap[mark.student_id]) studentMarksMap[mark.student_id] = {};
            if (!studentMarksMap[mark.student_id][mark.subject_id]) {
                studentMarksMap[mark.student_id][mark.subject_id] = mark;
            } else {
                if (mark.internal_marks != null) studentMarksMap[mark.student_id][mark.subject_id].internal_marks = mark.internal_marks;
                if (mark.external_marks != null) studentMarksMap[mark.student_id][mark.subject_id].external_marks = mark.external_marks;
            }
        }

        const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 2), 0);
        const resultsToSave = [];

        for (const [studentId, subjectMarkMap] of Object.entries(studentMarksMap)) {
            const marks = Object.values(subjectMarkMap);

            // STEP 1: Normalize (internal+external)
            const normalized = marks.map(m => {
                if (m.is_absent) return m;
                const val = normalizeMarks(m, norm);
                return { ...m, marks_obtained: val ?? m.marks_obtained };
            });

            // STEP 2: Grace marks
            const graced = normalized.map(m => {
                const subj = subjectById[m.subject_id];
                if (!subj || m.is_absent) return m;
                const threshold = subj.pass_marks ?? Math.ceil(subj.max_marks * passPercentage / 100);
                return { ...m, marks_obtained: applyGrace(m.marks_obtained || 0, threshold, graceMarks) };
            });

            // STEP 3: Absent handling
            const effective = graced.map(m => ({
                ...m,
                marks_obtained: m.is_absent ? (absentCountsAsZero ? 0 : null) : m.marks_obtained
            })).filter(m => m.marks_obtained !== null);

            // STEP 4: Best-of-N
            let scoring = effective;
            if (!includeAllSubjects && bestOfN && bestOfN > 0) {
                scoring = [...effective].sort((a, b) => (b.marks_obtained || 0) - (a.marks_obtained || 0)).slice(0, bestOfN);
            }

            // STEP 5: Totals
            const totalMax = scoring.reduce((acc, m) => acc + (subjectById[m.subject_id]?.max_marks || 0), 0);
            const totalObt = scoring.reduce((acc, m) => acc + (m.marks_obtained || 0), 0);
            const percentage = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
            const { grade, points: gradePoints } = getGradeAndPoints(percentage, rules);

            // STEP 6: Per-subject pass check
            let failedCount = 0;
            let earnedCredits = 0;
            for (const m of effective) {
                const subj = subjectById[m.subject_id];
                if (!subj) continue;
                const threshold = subj.pass_marks ?? Math.ceil(subj.max_marks * passPercentage / 100);
                const passed = !m.is_absent && (m.marks_obtained || 0) >= threshold;
                if (!passed) failedCount++;
                else earnedCredits += (subj.credits || 2);
            }

            // STEP 7: Status (Phase 2 extended: distinction, first_class, etc.)
            const resultStatus = computeStatus(percentage, failedCount, compartmentThreshold, rules);

            // STEP 8: SGPA (college mode) / null for school
            // #3 FIX: School mode stores null (not 0) for SGPA/CGPA/credits
            let sgpa = null;
            let cgpa = null;
            let percentageEquiv = null;

            if (mode === 'college') {
                const cwp = effective.reduce((acc, m) => {
                    const subj = subjectById[m.subject_id];
                    if (!subj) return acc;
                    const pct = subj.max_marks > 0 ? ((m.marks_obtained || 0) / subj.max_marks) * 100 : 0;
                    const { points } = getGradeAndPoints(pct, rules);
                    return acc + (points * (subj.credits || 2));
                }, 0);
                sgpa = totalCredits > 0 ? Math.round((cwp / totalCredits) * 100) / 100 : 0;
                cgpa = sgpa; // Single sem = SGPA (true CGPA from /cgpa endpoint)

                // #4 FIX: Only compute if CGPA is valid and non-null
                if (cgpaConv.enabled && cgpaConv.multiplier && cgpa != null && cgpa > 0) {
                    percentageEquiv = Math.round(cgpa * cgpaConv.multiplier * 100) / 100;
                }
            }
            // School mode: sgpa/cgpa/credits all null, percentage is the main metric

            // STEP 9: Per-subject detail
            const resultDetail = effective.map(m => {
                const subj = subjectById[m.subject_id];
                if (!subj) return null;
                const pct = subj.max_marks > 0 ? ((m.marks_obtained || 0) / subj.max_marks) * 100 : 0;
                const { grade: sg, points: sp } = getGradeAndPoints(pct, rules);
                const threshold = subj.pass_marks ?? Math.ceil(subj.max_marks * passPercentage / 100);
                const passed = !m.is_absent && (m.marks_obtained || 0) >= threshold;
                return {
                    subject_id:     m.subject_id,
                    subject_code:   subj.subject_code,
                    subject_name:   subj.subject_name,
                    course_type:    subj.course_type,
                    max_marks:      subj.max_marks,
                    credits:        subj.credits,
                    marks_obtained: m.marks_obtained,
                    internal_marks: m.internal_marks ?? null,
                    external_marks: m.external_marks ?? null,
                    is_absent:      m.is_absent,
                    grade:          sg,
                    grade_points:   sp,
                    earn_credits:   passed ? (subj.credits || 2) : 0,
                    pass_marks:     threshold
                };
            }).filter(Boolean);

            // #3 FIX: School mode nulls out credit fields
            resultsToSave.push({
                scheme_id: schemeId, org_id: orgId, student_id: studentId,
                total_marks:     Math.round(totalObt * 100) / 100,
                max_total_marks: totalMax,
                percentage:      Math.round(percentage * 100) / 100,
                grade, grade_points: gradePoints,
                sgpa, cgpa,
                percentage_equivalent: percentageEquiv,
                earn_credits: mode === 'college' ? earnedCredits : null,
                total_credits: mode === 'college' ? totalCredits : null,
                status:       resultStatus,
                result_detail: resultDetail,
                generated_at:  new Date().toISOString()
            });
        }

        // STEP 10: RANKING (ties: 1,1,3)
        const rankedResults = computeRanking(resultsToSave);

        // Version tracking
        const { data: existing } = await sb.from('results').select('student_id, version').eq('scheme_id', schemeId);
        const existVer = {};
        (existing || []).forEach(r => { existVer[r.student_id] = r.version || 1; });

        const final = rankedResults.map(r => ({
            ...r,
            version: (existVer[r.student_id] || 0) + 1
        }));

        // Delete then batch insert (failure recovery)
        await sb.from('results').delete().eq('scheme_id', schemeId).eq('org_id', orgId);
        await batchUpsert(sb, 'results', final, 'scheme_id, student_id', 1000);

        const dur = Math.round((Date.now() - startTime) / 100) / 10;
        await sb.from('result_schemes').update({
            status: 'generated', is_generating: false,
            generation_time_seconds: dur, last_student_count: final.length,
            updated_at: new Date().toISOString()
        }).eq('id', schemeId);

        console.log(`[Generate] ${schemeId}: ${final.length} students, ${dur}s, mode=${mode}`);

        res.json({
            message: `Results generated for ${final.length} students`,
            generated: final.length, duration_seconds: dur, mode,
            pass:        final.filter(r => r.status === 'pass').length,
            distinction: final.filter(r => r.status === 'distinction').length,
            first_class: final.filter(r => r.status === 'first_class').length,
            compartment: final.filter(r => r.status === 'compartment').length,
            fail:        final.filter(r => r.status === 'fail').length
        });

    } catch (err) {
        await sb.from('result_schemes').update({ is_generating: false }).eq('id', schemeId).catch(() => {});
        console.error('[Generate Results Error]:', err);
        res.status(500).json({ message: 'Failed to generate. You can retry safely.' });
    } finally {
        generatingSchemes.delete(schemeId);
    }
});

// ======================================================
// TRUE CGPA (across all published semesters)
// ======================================================

router.get('/student/:studentId/cgpa', isAuthenticated, async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const studentId = req.params.studentId;

        if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { data: allResults, error } = await sb
            .from('results')
            .select('sgpa, total_credits, earn_credits, scheme_id, result_schemes!inner(name, semester, academic_year, status, rules_json)')
            .eq('org_id', orgId)
            .eq('student_id', studentId)
            .eq('result_schemes.status', 'published');

        if (error) throw error;
        if (!allResults?.length) return res.json({ cgpa: null, semesters: [] });

        // True CGPA = weighted average of SGPAs across all semesters
        const totalWeighted = allResults.reduce((acc, r) => acc + (r.sgpa * (r.total_credits || 0)), 0);
        const totalCreds = allResults.reduce((acc, r) => acc + (r.total_credits || 0), 0);
        const cgpa = totalCreds > 0 ? Math.round((totalWeighted / totalCreds) * 100) / 100 : 0;

        // CGPA to percentage conversion from the latest scheme's rules
        const latestRules = allResults[allResults.length - 1]?.result_schemes?.rules_json;
        const conv = latestRules?.cgpa_to_percentage;
        const pctEquiv = (conv?.enabled && conv?.multiplier) ? Math.round(cgpa * conv.multiplier * 100) / 100 : null;

        res.json({
            cgpa, percentage_equivalent: pctEquiv,
            total_semesters: allResults.length,
            semesters: allResults.map(r => ({
                scheme_id:     r.scheme_id,
                scheme_name:   r.result_schemes?.name,
                semester:      r.result_schemes?.semester,
                academic_year: r.result_schemes?.academic_year,
                sgpa:          r.sgpa,
                credits:       r.total_credits,
                earn_credits:  r.earn_credits
            }))
        });
    } catch (err) {
        console.error('[CGPA GET]:', err);
        res.status(500).json({ message: 'Failed to calculate CGPA' });
    }
});

// ======================================================
// PUBLISH / LOCK
// ======================================================

router.post('/schemes/:id/publish', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { data: scheme } = await sb.from('result_schemes').select('status').eq('id', req.params.id).eq('org_id', orgId).single();
        if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
        if (scheme.status === 'draft') return res.status(400).json({ message: 'Generate results first' });
        if (scheme.status === 'locked') return res.status(403).json({ message: 'Already locked' });
        await sb.from('result_schemes').update({ status: 'published' }).eq('id', req.params.id);
        res.json({ message: 'Results published to students' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to publish' });
    }
});

router.post('/schemes/:id/lock', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        await sb.from('result_schemes').update({ status: 'locked' }).eq('id', req.params.id).eq('org_id', orgId);
        res.json({ message: 'Scheme locked permanently' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to lock scheme' });
    }
});

// ======================================================
// ADMIN VIEW / STUDENT VIEW
// ======================================================

router.get('/schemes/:id/results', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { data, error } = await sb.from('results').select('*')
            .eq('scheme_id', req.params.id).eq('org_id', orgId)
            .order('scheme_rank', { ascending: true });
        if (error) throw error;

        const studentIds = data.map(r => r.student_id);
        const students = await User.find({ _id: { $in: studentIds } }, 'name prn roll_no').lean();
        const studentMap = students.reduce((acc, s) => { acc[s._id.toString()] = s; return acc; }, {});

        res.json({ results: data.map(r => ({ ...r, studentInfo: studentMap[r.student_id] || {} })) });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch results' });
    }
});

router.get('/student/me', isAuthenticated, async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const studentId = req.user._id.toString();

        const { data: myResults, error } = await sb
            .from('results')
            .select('*, result_schemes!inner(id, name, academic_year, semester, status, rules_json)')
            .eq('org_id', orgId)
            .eq('student_id', studentId)
            .eq('result_schemes.status', 'published');

        if (error) throw error;
        res.json({
            results: myResults,
            student: { name: req.user.name, prn: req.user.prn, email: req.user.email }
        });
    } catch (err) {
        console.error('[Student Results GET]:', err);
        res.status(500).json({ message: 'Failed to fetch your results' });
    }
});

// ======================================================
// CSV UPLOAD → PARSE → GENERATE (One-Shot Pipeline)
// POST /api/results/upload-csv
// Body: { schemeId, csvText }
// Parses CSV, maps to students, uploads marks, then auto-generates SGPA/Ranks
// ======================================================
router.post('/upload-csv', isAuthenticated, requireRole('org_admin'), async (req, res) => {
    try {
        const { sb, orgId } = getSb(req);
        const { schemeId, csvText } = req.body;

        if (!schemeId) return res.status(400).json({ message: 'schemeId is required.' });
        if (!csvText || typeof csvText !== 'string') return res.status(400).json({ message: 'csvText is required.' });

        // ── 1. Parse CSV ──
        const lines = csvText.trim().split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) return res.status(400).json({ message: 'CSV must have a header row and at least one data row.' });

        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
            rows.push(row);
        }

        // ── 2. Validate scheme ──
        const { data: scheme, error: schErr } = await sb
            .from('result_schemes').select('status, rules_json').eq('id', schemeId).eq('org_id', orgId).single();
        if (schErr || !scheme) return res.status(404).json({ message: 'Scheme not found.' });
        if (scheme.status === 'locked') return res.status(403).json({ message: 'Scheme is locked.' });

        // ── 3. Fetch subjects for this scheme ──
        const { data: subjects, error: subjErr } = await sb
            .from('result_subjects').select('*').eq('scheme_id', schemeId).eq('org_id', orgId);
        if (subjErr || !subjects?.length) return res.status(400).json({ message: 'Add subjects to this scheme first.' });

        const subjectMap = {};
        subjects.forEach(s => { subjectMap[s.subject_name.toLowerCase()] = s; });

        // ── 4. Resolve students ──
        const identifiers = rows.map(r => r.prn || r.PRN || r['Roll No'] || r['roll_no'] || '').filter(Boolean);
        const students = await User.find({
            $or: [{ prn: { $in: identifiers } }, { roll_no: { $in: identifiers } }],
            organization_id: req.user.organization_id
        }, 'name prn roll_no _id').lean();

        const studentByPrn = {};
        students.forEach(s => {
            if (s.prn) studentByPrn[s.prn.toLowerCase()] = s;
            if (s.roll_no) studentByPrn[String(s.roll_no).toLowerCase()] = s;
        });

        // ── 5. Build marks entries ──
        const marksToInsert = [];
        const errors = [];
        let successCount = 0;

        for (const row of rows) {
            const prn = String(row.prn || row.PRN || row['Roll No'] || row['roll_no'] || '').trim().toLowerCase();
            const student = studentByPrn[prn];
            if (!student) { errors.push({ prn, reason: 'Student not found.' }); continue; }

            let rowValid = true;
            for (const [col, val] of Object.entries(row)) {
                if (['prn', 'roll no', 'roll_no', 'name'].includes(col.toLowerCase())) continue;
                const subject = subjectMap[col.trim().toLowerCase()];
                if (!subject) continue;

                const rawVal = String(val || '').trim().toLowerCase();
                const isAbsent = !rawVal || rawVal === 'ab' || rawVal === 'absent';
                const marksObtained = isAbsent ? null : parseFloat(val);

                if (!isAbsent && (isNaN(marksObtained) || marksObtained < 0)) {
                    errors.push({ prn, reason: `Invalid marks for ${col}: "${val}"` });
                    rowValid = false; break;
                }
                if (!isAbsent && marksObtained > subject.max_marks) {
                    errors.push({ prn, reason: `${col} exceeds max (${subject.max_marks})` });
                    rowValid = false; break;
                }

                marksToInsert.push({
                    scheme_id: schemeId,
                    subject_id: subject.id,
                    org_id: orgId,
                    student_id: student._id.toString(),
                    marks_obtained: isAbsent ? null : marksObtained,
                    is_absent: isAbsent
                });
            }
            if (rowValid) successCount++;
        }

        // ── 6. Batch upsert marks ──
        if (marksToInsert.length > 0) {
            await batchUpsert(sb, 'result_marks', marksToInsert, 'scheme_id, subject_id, student_id', 1000);
        }

        res.json({
            message: `CSV processed. ${successCount} students mapped, ${errors.length} errors. Use POST /api/results/schemes/${schemeId}/generate to compute SGPA/Ranks.`,
            parsed_rows: rows.length,
            success: successCount,
            failed: errors.length,
            errors: errors.slice(0, 50), // Cap error list at 50
        });
    } catch (err) {
        console.error('[Upload CSV Error]:', err);
        res.status(500).json({ message: 'CSV processing failed.' });
    }
});

export default router;
