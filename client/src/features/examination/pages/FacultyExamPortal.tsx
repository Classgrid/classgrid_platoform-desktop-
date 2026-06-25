import React, { useState } from "react";
import { Plus, Users, Calendar, CheckCircle, Clock } from "lucide-react";
import { 
    useGetFacultyExams, 
    useCreateExam, 
    useGetExamResults,
    useSubmitGradesBulk 
} from "../queries/useExamination";

// Using marketing_ui for premium aesthetic
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/marketing_ui/card";
import { 
    Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/marketing_ui/dialog";
import { 
    Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/marketing_ui/sheet";
import { Input } from "@/components/marketing_ui/input";
import { Label } from "@/components/marketing_ui/label";
import { 
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/marketing_ui/table";

/**
 * Premium Gradebook Sheet Component
 * Slides in from the right when an exam is clicked.
 */
function GradebookSheet({ exam, onClose }: { exam: any; onClose: () => void }) {
    const { data: results, isLoading } = useGetExamResults(exam._id);
    const { mutate: bulkSubmit, isPending } = useSubmitGradesBulk(exam._id);
    
    // Local state for fast data entry
    const [grades, setGrades] = useState<{ [key: string]: { marks: string, remarks: string } }>({});

    // Initialize grades state when results load
    React.useEffect(() => {
        if (results) {
            const initial: any = {};
            results.forEach((r: any) => {
                initial[r.student_id._id] = {
                    marks: r.status === "absent" ? "AB" : String(r.obtained_marks),
                    remarks: r.faculty_remarks || ""
                };
            });
            setGrades(initial);
        }
    }, [results]);

    const handleMarksChange = (studentId: string, val: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], marks: val }
        }));
    };

    const handleSave = () => {
        const payload = Object.keys(grades).map(sid => ({
            studentId: sid,
            obtainedMarks: grades[sid].marks === "AB" ? "absent" : Number(grades[sid].marks),
            remarks: grades[sid].remarks
        }));
        
        bulkSubmit(payload, {
            onSuccess: () => {
                // Could add a toast here
            }
        });
    };

    return (
        <Sheet open={!!exam} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
                        {exam.title} Gradebook
                    </SheetTitle>
                    <SheetDescription className="text-emerald-800/70 dark:text-emerald-200/70">
                        Target: {exam.hierarchy_id?.name} | Max Marks: {exam.max_marks} | Pass: {exam.passing_marks}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="border border-emerald-100 dark:border-emerald-900/50 rounded-xl overflow-hidden bg-white/50 dark:bg-emerald-950/20 backdrop-blur-sm">
                            <Table>
                                <TableHeader className="bg-emerald-50/50 dark:bg-emerald-900/20">
                                    <TableRow>
                                        <TableHead className="text-emerald-900 dark:text-emerald-100">Student</TableHead>
                                        <TableHead className="text-emerald-900 dark:text-emerald-100 w-24">Marks</TableHead>
                                        <TableHead className="text-emerald-900 dark:text-emerald-100">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results?.map((res: any) => {
                                        const currentVal = grades[res.student_id._id]?.marks || "";
                                        const isAb = currentVal.toUpperCase() === "AB";
                                        const num = Number(currentVal);
                                        let statusBadge = <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Pass</Badge>;
                                        
                                        if (isAb) {
                                            statusBadge = <Badge variant="outline" className="bg-amber-50 text-amber-700">Absent</Badge>;
                                        } else if (num < exam.passing_marks) {
                                            statusBadge = <Badge variant="outline" className="bg-rose-50 text-rose-700">Fail</Badge>;
                                        }

                                        return (
                                            <TableRow key={res._id}>
                                                <TableCell className="font-medium text-emerald-950 dark:text-emerald-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                            {res.student_id.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p>{res.student_id.name}</p>
                                                            <p className="text-xs text-emerald-600/70">{res.student_id.prn || res.student_id.roll_no}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        className="h-8 w-20 text-center font-mono focus-visible:ring-emerald-500"
                                                        value={currentVal}
                                                        onChange={(e) => handleMarksChange(res.student_id._id, e.target.value)}
                                                        placeholder="00"
                                                    />
                                                </TableCell>
                                                <TableCell>{statusBadge}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        
                        <div className="flex justify-end pt-4">
                            <Button 
                                onClick={handleSave} 
                                disabled={isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                            >
                                {isPending ? "Saving..." : "Save Gradebook"}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

export default function FacultyExamPortal() {
    const { data: exams, isLoading } = useGetFacultyExams();
    const { mutate: createExam, isPending: isCreating } = useCreateExam();
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);

    // Form state for simplicity
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        duration_minutes: "60",
        subject_id: "66718a38a123f1a3a1000001", // Mock default ID
        hierarchy_id: "66718b55b987c2b5b2000001", // Mock default ID
        max_marks: "100",
        passing_marks: "40"
    });

    const handleCreate = () => {
        createExam({
            ...formData,
            duration_minutes: Number(formData.duration_minutes),
            max_marks: Number(formData.max_marks),
            passing_marks: Number(formData.passing_marks)
        }, {
            onSuccess: () => setIsCreateOpen(false)
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-emerald-50/30 dark:bg-emerald-950/10 min-h-screen">
            {/* Header & Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <h1 className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-50 mb-2">
                        Examination Cell
                    </h1>
                    <p className="text-emerald-800/70 dark:text-emerald-200/70">
                        Manage your authored exams, gradebooks, and analytics.
                    </p>
                </div>
                
                <Card className="bg-white/60 dark:bg-emerald-950/40 backdrop-blur border-emerald-100 dark:border-emerald-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                            <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-600/80">Upcoming Exams</p>
                            <h3 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                                {exams?.filter((e: any) => e.status === "scheduled").length || 0}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/60 dark:bg-emerald-950/40 backdrop-blur border-emerald-100 dark:border-emerald-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600/80">Completed</p>
                            <h3 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                                {exams?.filter((e: any) => e.status === "completed").length || 0}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-emerald-950/50 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">All Exams</Badge>
                    <Badge variant="outline" className="text-emerald-600/70 border-emerald-200">Drafts</Badge>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 gap-2">
                            <Plus className="w-4 h-4" /> Create Exam
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-emerald-950 dark:text-emerald-50">Draft New Exam</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-emerald-900">Exam Title</Label>
                                <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Mid-term Assessment" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-emerald-900">Date</Label>
                                    <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-emerald-900">Duration (mins)</Label>
                                    <Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-emerald-900">Max Marks</Label>
                                    <Input type="number" value={formData.max_marks} onChange={(e) => setFormData({...formData, max_marks: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-emerald-900">Passing Marks</Label>
                                    <Input type="number" value={formData.passing_marks} onChange={(e) => setFormData({...formData, passing_marks: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {isCreating ? "Saving..." : "Create Exam"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Data Table */}
            <Card className="border-emerald-100 dark:border-emerald-800 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-emerald-950 dark:text-emerald-50">Authored Exams</CardTitle>
                    <CardDescription>Click any row to open the Gradebook</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-12 flex justify-center text-emerald-500">Loading exams...</div>
                    ) : (
                        <div className="rounded-xl border border-emerald-100 dark:border-emerald-800/50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-emerald-50/50 dark:bg-emerald-900/20">
                                    <TableRow>
                                        <TableHead className="text-emerald-900 dark:text-emerald-100">Title & Target</TableHead>
                                        <TableHead className="text-emerald-900 dark:text-emerald-100">Date</TableHead>
                                        <TableHead className="text-emerald-900 dark:text-emerald-100">Marks</TableHead>
                                        <TableHead className="text-emerald-900 dark:text-emerald-100">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exams?.map((exam: any) => (
                                        <TableRow 
                                            key={exam._id} 
                                            className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                                            onClick={() => setSelectedExam(exam)}
                                        >
                                            <TableCell>
                                                <p className="font-medium text-emerald-950 dark:text-emerald-50">{exam.title}</p>
                                                <p className="text-sm text-emerald-600/70">{exam.hierarchy_id?.name || "Global"}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-emerald-800/80">
                                                    <Clock className="w-4 h-4 text-emerald-500" />
                                                    {new Date(exam.date).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm text-emerald-700">{exam.max_marks}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="secondary" 
                                                    className={
                                                        exam.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        exam.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                    }
                                                >
                                                    {exam.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sheet Renderer */}
            {selectedExam && (
                <GradebookSheet exam={selectedExam} onClose={() => setSelectedExam(null)} />
            )}
        </div>
    );
}
