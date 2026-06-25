import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { useGetStudentActiveForms, useGetFormDetails, useSubmitFeedback } from "../queries/useFeedback";
import { CheckCircle2, ArrowLeft, Star, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- SUBCOMPONENT: The Actual Form ---
function StudentFeedbackForm({ formId, onBack }: { formId: string, onBack: () => void }) {
  const { data, isLoading } = useGetFormDetails(formId);
  const submitFeedback = useSubmitFeedback(formId);
  
  // Local state to track student answers
  // Structure: { questionId: { response_value, comment } }
  const [responses, setResponses] = useState<Record<string, { response_value: string, comment: string }>>({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-8">
            {[1, 2].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24 rounded-md" />
                  <Skeleton className="h-10 w-24 rounded-md" />
                </div>
                <Skeleton className="h-24 w-full rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { form, questions } = data || {};

  const handleRatingSelect = (questionId: string, rating: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], response_value: rating, comment: prev[questionId]?.comment || "" }
    }));
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], response_value: prev[questionId]?.response_value || "", comment }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const allAnswered = questions?.every((q: any) => q.is_required ? responses[q.id]?.response_value : true);
    if (!allAnswered) {
      return toast.error("Please provide a rating for all required questions.");
    }

    const payload = {
      responses: Object.entries(responses).map(([question_id, val]) => ({
        question_id,
        response_value: val.response_value,
        comment: val.comment
      }))
    };

    submitFeedback.mutate(payload, {
      onSuccess: () => {
        toast.success("Feedback submitted anonymously!");
        onBack();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Failed to submit feedback.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:bg-muted/50 -ml-2 h-8 text-sm">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pending List
      </Button>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-6">
            <CardTitle className="text-2xl font-bold">{form?.title}</CardTitle>
            <CardDescription className="text-sm mt-1">
              Target: <span className="font-medium text-foreground">{form?.target_teacher_name || form?.subject_name}</span>
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {form?.description || "Your feedback is 100% anonymous. Please provide honest and constructive responses to help us improve the learning experience."}
            </p>
          </CardHeader>
          
          <CardContent className="p-0 divide-y divide-border/40">
            {questions?.map((q: any, idx: number) => {
              const currentResponse = responses[q.id];
              const options = q.options || ["Good", "Better", "Best", "Excellent"]; // Fallback to prompt options

              return (
                <div key={q.id} className="p-6 md:p-8 space-y-5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <h3 className="font-medium text-base text-foreground leading-snug">
                      {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                    </h3>
                  </div>

                  <div className="pl-9 space-y-4">
                    {/* Rating Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt: string) => {
                        const isSelected = currentResponse?.response_value === opt;
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => handleRatingSelect(q.id, opt)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                              isSelected 
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                                : "bg-card border-border/60 text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {/* Comment Textarea */}
                    <div className="pt-2">
                      <textarea
                        value={currentResponse?.comment || ""}
                        onChange={(e) => handleCommentChange(q.id, e.target.value)}
                        placeholder="Additional comments (optional)..."
                        className="flex min-h-[80px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-y"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button 
            type="submit" 
            disabled={submitFeedback.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-8"
          >
            {submitFeedback.isPending ? "Submitting..." : (
              <>
                <Send className="w-4 h-4 mr-2" /> Submit Feedback
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- MAIN PAGE ---
export function StudentFeedbackPage() {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const { data, isLoading } = useGetStudentActiveForms();

  const activeForms = data?.forms?.filter((f: any) => !f.submitted) || [];

  return (
    <DashboardLayout role="student">
      {!selectedFormId ? (
        <div className="space-y-6">
          <PageHeader 
            title="Feedback & Surveys" 
            description="Help us improve by providing your anonymous feedback." 
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : activeForms.length === 0 ? (
            <Card className="border-border/50 border-dashed bg-muted/10 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  You have no pending feedback forms to complete. Thank you for your contributions!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeForms.map((form: any) => (
                <Card 
                  key={form.id} 
                  className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-500/50 group flex flex-col"
                  onClick={() => setSelectedFormId(form.id)}
                >
                  <CardHeader className="pb-4 border-b border-border/20">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors">
                          {form.title}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">
                          Target: {form.target_teacher_name || form.subject_name || "General"}
                        </CardDescription>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 transition-colors">
                        <Star className="w-5 h-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col justify-end">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {form.description || "Click to begin your anonymous feedback submission."}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-medium bg-red-500/10 text-red-600 px-2 py-1 rounded-md">
                        Due: {new Date(form.end_date).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline" className="h-8 text-xs bg-muted/30">
                        Start <ArrowRight className="w-3 h-3 ml-1 opacity-70" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <StudentFeedbackForm formId={selectedFormId} onBack={() => setSelectedFormId(null)} />
      )}
    </DashboardLayout>
  );
}
