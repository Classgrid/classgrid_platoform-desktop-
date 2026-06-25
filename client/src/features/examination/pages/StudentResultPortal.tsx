import React from "react";
import { Calendar, FileText, Download, Award, AlertCircle } from "lucide-react";
import { useGetStudentExams, useGetStudentReportCard } from "../queries/useExamination";

// Premium marketing_ui components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { 
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/marketing_ui/table";

/**
 * GlowCard for upcoming exams
 */
function GlowingExamCard({ exam }: { exam: any }) {
    return (
        <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            
            <Card className="relative bg-white dark:bg-emerald-950/80 border-emerald-100 dark:border-emerald-800/50 shadow-sm h-full">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl">
                            <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                            {exam.duration_minutes} mins
                        </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 mb-1">
                        {exam.title}
                    </h3>
                    <p className="text-sm font-medium text-emerald-700/80 dark:text-emerald-300/80 mb-4">
                        {exam.subject_id?.name || "Subject TBA"}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm border-t border-emerald-100 dark:border-emerald-800/50 pt-4 mt-4">
                        <span className="text-emerald-600/70">{new Date(exam.date).toLocaleDateString()}</span>
                        <span className="font-mono font-medium text-emerald-800 dark:text-emerald-200">Max: {exam.max_marks}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function StudentResultPortal() {
    // In a real app, this comes from an Auth Context or Redux store
    const studentId = "mock-student-id"; 
    const hierarchyId = "mock-hierarchy-id"; 

    // Fetch Upcoming Exams (Scheduled)
    const { data: upcomingExams, isLoading: loadingExams } = useGetStudentExams([hierarchyId], "scheduled");

    // Fetch the Student's Cumulative Report Card
    const { data: reportCard, isLoading: loadingReport } = useGetStudentReportCard(studentId, hierarchyId);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 bg-emerald-50/20 dark:bg-emerald-950/10 min-h-screen">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50 mb-2">
                        Student Portal
                    </h1>
                    <p className="text-lg text-emerald-800/70 dark:text-emerald-200/70">
                        Your academic schedule and performance analytics.
                    </p>
                </div>
            </div>

            {/* Upcoming Exams Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Upcoming Exams</h2>
                    <Badge className="bg-emerald-600 hover:bg-emerald-700">{upcomingExams?.length || 0}</Badge>
                </div>
                
                {loadingExams ? (
                    <div className="text-emerald-500 py-8">Loading schedule...</div>
                ) : upcomingExams?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingExams.map((exam: any) => (
                            <GlowingExamCard key={exam._id} exam={exam} />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed border-2 border-emerald-200 bg-transparent shadow-none">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-emerald-600/70">
                            <Calendar className="w-12 h-12 mb-4 text-emerald-300" />
                            <p>No upcoming exams scheduled for your class.</p>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Premium Report Card Section */}
            <section className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Cumulative Report Card</h2>
                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                    </Button>
                </div>

                {loadingReport ? (
                    <div className="text-emerald-500 py-8">Generating report...</div>
                ) : reportCard ? (
                    <Card className="bg-white dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800 shadow-xl overflow-hidden">
                        
                        {/* Report Card Top Banner */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                    <Award className="w-10 h-10 text-emerald-50" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold mb-1">{reportCard.student?.name || "Student Name"}</h3>
                                    <p className="text-emerald-100/90 font-medium">{reportCard.hierarchy?.name || "Term / Standard"}</p>
                                    <p className="text-sm text-emerald-200/80 mt-1">PRN: {reportCard.student?.prn || "N/A"}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-8 items-center bg-black/20 p-6 rounded-2xl backdrop-blur-md">
                                <div className="text-center">
                                    <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-1">Percentage</p>
                                    <p className="text-4xl font-black">{reportCard.summary?.percentage}%</p>
                                </div>
                                <div className="w-px h-12 bg-white/20"></div>
                                <div className="text-center">
                                    <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-1">Grade</p>
                                    <p className="text-4xl font-black">{reportCard.summary?.overall_grade}</p>
                                </div>
                                <div className="w-px h-12 bg-white/20"></div>
                                <div className="text-center">
                                    <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-1">Status</p>
                                    <Badge className={`mt-2 ${reportCard.summary?.status === "PASS" ? "bg-emerald-400 text-emerald-950" : "bg-rose-500 text-white"}`}>
                                        {reportCard.summary?.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Subject Breakdown Table */}
                        <div className="p-0">
                            <Table>
                                <TableHeader className="bg-emerald-50/80 dark:bg-emerald-900/30">
                                    <TableRow>
                                        <TableHead className="text-emerald-900 font-semibold px-8">Subject</TableHead>
                                        <TableHead className="text-emerald-900 font-semibold text-center">Max Marks</TableHead>
                                        <TableHead className="text-emerald-900 font-semibold text-center">Passing</TableHead>
                                        <TableHead className="text-emerald-900 font-semibold text-center">Obtained</TableHead>
                                        <TableHead className="text-emerald-900 font-semibold text-right px-8">Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportCard.subject_details?.map((sub: any) => (
                                        <TableRow key={sub.exam_id} className="hover:bg-emerald-50/40">
                                            <TableCell className="font-medium text-emerald-950 px-8 py-4">
                                                {sub.subject_name}
                                                {sub.status === "fail" && <AlertCircle className="inline w-4 h-4 ml-2 text-rose-500" />}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-emerald-600/70">{sub.max_marks}</TableCell>
                                            <TableCell className="text-center font-mono text-emerald-600/70">{sub.passing_marks}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`font-mono font-bold text-lg ${
                                                    sub.is_absent ? "text-amber-600" :
                                                    sub.status === "fail" ? "text-rose-600" : "text-emerald-700"
                                                }`}>
                                                    {sub.is_absent ? "ABSENT" : sub.obtained_marks}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right px-8 text-sm text-emerald-600/80 italic">
                                                {sub.remarks || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                ) : (
                    <Card className="border-dashed border-2 border-emerald-200 bg-transparent shadow-none">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-emerald-600/70">
                            <FileText className="w-12 h-12 mb-4 text-emerald-300" />
                            <p>No results published for this term yet.</p>
                        </CardContent>
                    </Card>
                )}
            </section>
        </div>
    );
}
