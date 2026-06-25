import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/marketing_ui/card";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/marketing_ui/table";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/marketing_ui/sheet";
import { useGetForms, useGetFacultyRatings, useCreateFeedbackForm } from "../queries/useFeedback";
import { Plus, BarChart, Users, Star, ArrowRight, Trash } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function CreateFeedbackSheet() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [applicability, setApplicability] = useState("all");
  const [questions, setQuestions] = useState([
    { question_text: "How would you rate this teacher's clarity?", question_type: "qualitative", is_required: true }
  ]);
  const createForm = useCreateFeedbackForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required");
    if (!questions.length) return toast.error("At least one question is required");

    try {
      await createForm.mutateAsync({
        title,
        target_teacher_name: teacherName,
        target_type: "teacher",
        applicability,
        questions,
      });
      toast.success("Feedback cycle created successfully!");
      setOpen(false);
      // Reset form
      setTitle("");
      setTeacherName("");
      setQuestions([{ question_text: "How would you rate this teacher's clarity?", question_type: "qualitative", is_required: true }]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create feedback cycle.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Create Feedback Cycle
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Feedback Cycle</SheetTitle>
          <SheetDescription>
            Launch a new anonymous feedback survey for your students.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Title</label>
              <input 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Mid-Semester Faculty Review" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Target Teacher</label>
              <input 
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                placeholder="e.g. John Doe (Optional)" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Applicability</label>
              <select 
                value={applicability}
                onChange={e => setApplicability(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Students in Organization</option>
                <option value="division">Specific Division</option>
              </select>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold leading-none">Questions</label>
                <Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, { question_text: "", question_type: "qualitative", is_required: true }])} className="h-7 text-xs border-dashed text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <input 
                        required
                        value={q.question_text}
                        onChange={e => {
                          const newQ = [...questions];
                          newQ[idx].question_text = e.target.value;
                          setQuestions(newQ);
                        }}
                        placeholder={`Question ${idx + 1}`} 
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      />
                    </div>
                    {questions.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setQuestions(questions.filter((_, i) => i !== idx))} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter className="pt-4 border-t border-border/50">
            <Button type="submit" disabled={createForm.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
              {createForm.isPending ? "Publishing..." : "Publish Feedback Form"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function OrgAdminFeedbackPage() {
  const { data: formsData, isLoading: isLoadingForms } = useGetForms();
  const { data: ratingsData, isLoading: isLoadingRatings } = useGetFacultyRatings();

  const forms = formsData?.forms || [];
  const faculty = ratingsData?.faculty || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": 
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>;
      case "closed": 
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">Closed</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPerformanceTag = (tag: string) => {
    switch (tag) {
      case "excellent": 
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Excellent</Badge>;
      case "strong": 
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">Strong</Badge>;
      case "average": 
        return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">Average</Badge>;
      case "needs_improvement": 
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">Needs Review</Badge>;
      default: 
        return null;
    }
  };

  return (
    <DashboardLayout role="org_admin">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2">
        <PageHeader 
          title="Feedback & Surveys" 
          description="Manage active feedback cycles and monitor faculty performance." 
        />
        <CreateFeedbackSheet />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Active Forms Table */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart className="w-5 h-5 text-emerald-600" />
                Feedback Forms
              </CardTitle>
              <CardDescription>View and manage all your organization's feedback cycles.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingForms ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                </div>
              ) : forms.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <BarChart className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>No feedback forms found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold text-foreground/80">Title</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Target</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                      <TableHead className="font-semibold text-foreground/80">Deadline</TableHead>
                      <TableHead className="text-right font-semibold text-foreground/80">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form: any) => (
                      <TableRow key={form.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium text-sm">{form.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{form.target_teacher_name || form.subject_name || 'General'}</TableCell>
                        <TableCell>{getStatusBadge(form.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(form.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10">
                            View <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Faculty Leaderboard */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm h-full">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-600 fill-emerald-600/20" />
                Faculty Leaderboard
              </CardTitle>
              <CardDescription>Top rated faculty based on student feedback.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingRatings ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : faculty.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto opacity-20 mb-3" />
                  <p>No faculty ratings yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {faculty.map((teacher: any, idx: number) => (
                    <div key={teacher.teacher_id} className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800 shadow-sm">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {teacher.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium bg-secondary text-secondary-foreground px-1.5 rounded flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {teacher.avg_rating}
                          </span>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {teacher.total_responses} reviews
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 hidden sm:block">
                        {getPerformanceTag(teacher.performance_tag)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
