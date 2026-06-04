import Groq from 'groq-sdk';
import AttendanceRecord from '../../models/AttendanceRecord.js';
import StudentMark from '../../models/StudentMark.js';
import QuizSession from '../../models/QuizSession.js';
import User from '../../models/User.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * generateStudentPersona
 * Analyzes a student's performance data and returns a personalized study persona and plan.
 */
export const generateStudentPersona = async (studentId, orgId) => {
    try {
        // 1. Fetch Student Profile
        const student = await User.findById(studentId).select('name email branch year batch academic_config');
        if (!student) throw new Error("Student not found");

        // 2. Fetch Recent Attendance (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const attendanceCount = await AttendanceRecord.countDocuments({
            student: studentId,
            markedAt: { $gte: thirtyDaysAgo }
        });

        // 3. Fetch Last 5 Marks
        const recentMarks = await StudentMark.find({ student: studentId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 4. Fetch Last 5 Quiz Sessions
        const recentQuizzes = await QuizSession.find({ userId: studentId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 5. Aggregate Data for Prompt
        const dataContext = {
            name: student.name,
            attendanceLast30Days: attendanceCount,
            academicProgress: recentMarks.map(m => ({
                exam: m.examRecord,
                percentage: m.percentage,
                grade: m.grade,
                subjects: m.subjectMarks.map(s => `${s.subjectName}:${s.marksObtained}/${s.maxMarks}`).join(', ')
            })),
            quizPerformance: recentQuizzes.map(q => ({
                topic: q.topic,
                score: `${q.score}/${q.totalQuestions}`,
                percentage: q.percentage
            }))
        };

        // 6. Request AI Analysis
        const systemPrompt = `You are the Classgrid AI Academic Coach. 
Analyze the provided student data and generate a "Student Persona" and a highly personalized "1-Week Improvement Plan".
Follow this output format strictly (Valid JSON):
{
  "personaName": "The Inconsistent High-Achiever", 
  "analysis": "A brief 2-sentence summary of their current standing.",
  "strengths": ["Physics", "Problem Solving"],
  "weaknesses": ["Attendance", "Regularity in Math"],
  "improvementPlan": [
    {"day": "Day 1-2", "focus": "Revise X topics", "reason": "Low scores in recent quiz"},
    {"day": "Day 3-4", "focus": "...", "reason": "..."},
    {"day": "Day 5-7", "focus": "...", "reason": "..."}
  ],
  "coachMotivation": "A short encouraging sentence."
}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `STUDENT DATA:\n${JSON.stringify(dataContext, null, 2)}` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
        console.error("[Persona Service] Error:", err);
        throw new Error(`Failed to generate student persona: ${err.message}`);
    }
};
