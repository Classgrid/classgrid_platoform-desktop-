import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/marketing_ui/card";
import { Badge } from "@/components/marketing_ui/badge";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { useGetForms, useGetFeedbackAnalytics } from "../queries/useFeedback";
import { Star, ShieldAlert, Sparkles, MessageSquare, BarChart3, ChevronRight, BrainCircuit } from "lucide-react";

export function FacultyFeedbackInsights() {
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>(undefined);
  const { data: formsData, isLoading: isLoadingForms } = useGetForms();

  const forms = formsData?.forms || [];

  // Auto-select the most recent form if none selected
  useEffect(() => {
    if (forms.length > 0 && !selectedFormId) {
      setSelectedFormId(forms[0].id);
    }
  }, [forms, selectedFormId]);

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useGetFeedbackAnalytics(selectedFormId);

  const analytics = analyticsData?.analytics;
  const comments = analyticsData?.comments || [];
  const privacyAlert = analyticsData?.privacy_alert;
  const insights = analytics?.ai_insights;
  const breakdown = analytics?.question_breakdown || {};

  const getPerformanceTag = (tag: string) => {
    switch (tag) {
      case "excellent": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-sm">Excellent</Badge>;
      case "strong": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1 text-sm">Strong</Badge>;
      case "average": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-1 text-sm">Average</Badge>;
      case "needs_improvement": return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-3 py-1 text-sm">Needs Improvement</Badge>;
      default: return null;
    }
  };

  return (
    <DashboardLayout role="faculty">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <PageHeader 
          title="Feedback Analytics" 
          description="Deep dive into your performance ratings and AI-summarized insights." 
        />
        
        {/* Form Selector */}
        <div className="flex flex-col gap-1.5 w-full md:w-64">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Feedback Cycle</label>
          {isLoadingForms ? (
            <Skeleton className="h-10 w-full rounded-md" />
          ) : (
            <ResponsiveSelect
              value={selectedFormId || ""}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {forms.map((form: any) => (
                <option key={form.id} value={form.id}>
                  {form.title} ({new Date(form.end_date).toLocaleDateString()})
                </option>
              ))}
            </ResponsiveSelect>
          )}
        </div>
      </div>

      {!selectedFormId && !isLoadingForms && (
        <Card className="border-border/50 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center py-20 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-bold text-foreground">No Feedback Cycles Available</h3>
            <p className="text-muted-foreground mt-2">You haven't been targeted in any feedback cycles yet.</p>
          </CardContent>
        </Card>
      )}

      {selectedFormId && isLoadingAnalytics && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      )}

      {selectedFormId && !isLoadingAnalytics && analyticsData && (
        <div className="space-y-6">
          
          {/* Privacy Alert */}
          {privacyAlert && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl shadow-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium leading-snug">{privacyAlert}</p>
            </div>
          )}

          {/* Top Overview Card */}
          <Card className="border-border/50 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <CardContent className="p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Overall Average Rating</h2>
                <div className="flex items-baseline justify-center sm:justify-start gap-2">
                  <span className="text-6xl font-black text-foreground tracking-tighter">
                    {analytics?.avg_rating || "0.0"}
                  </span>
                  <span className="text-2xl font-bold text-muted-foreground">/ 5.0</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-foreground">{analytics?.total_responses || 0} Total Responses</span>
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-3 mt-4 sm:mt-0">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Performance Tag</span>
                {getPerformanceTag(analytics?.performance_tag)}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: AI Insights & Comments */}
            <div className="space-y-6">
              {/* AI Insights Card */}
              {insights && Object.keys(insights).length > 0 && (
                <Card className="border-emerald-500/20 shadow-md bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-emerald-600/20">
                    <BrainCircuit className="w-24 h-24" />
                  </div>
                  <CardHeader className="pb-3 border-b border-emerald-500/10">
                    <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                      AI Executive Summary
                    </CardTitle>
                    <CardDescription>Synthesized automatically from student comments</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 relative z-10">
                    {insights.strengths?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ChevronRight className="w-4 h-4" /> Core Strengths
                        </h4>
                        <ul className="space-y-2">
                          {insights.strengths.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.weaknesses?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                          <ChevronRight className="w-4 h-4" /> Areas for Improvement
                        </h4>
                        <ul className="space-y-2">
                          {insights.weaknesses.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/40">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    Anonymized Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">
                      <p>{privacyAlert ? "Comments are locked due to privacy thresholds." : "No written comments provided by students."}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {comments.map((c: any, i: number) => (
                        <div key={i} className="p-5 hover:bg-muted/10 transition-colors">
                          <p className="text-sm text-foreground italic leading-relaxed">"{c.comment}"</p>
                          <span className="text-xs font-medium text-muted-foreground mt-3 block">
                            — Anonymous Student
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Question Breakdown */}
            <div className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/40">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Detailed Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {Object.entries(breakdown).length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">
                      No question breakdown data available.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {Object.entries(breakdown).map(([qId, qData]: [string, any]) => {
                        const maxVal = Math.max(...Object.values(qData.distribution as Record<string, number>).concat(1));
                        const isHidden = qData.distribution.Hidden !== undefined;

                        return (
                          <div key={qId} className="p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="text-sm font-semibold text-foreground leading-snug">
                                {qData.question}
                              </h4>
                              {!isHidden && (
                                <Badge variant="secondary" className="bg-muted text-foreground whitespace-nowrap">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
                                  {qData.average}
                                </Badge>
                              )}
                            </div>

                            {isHidden ? (
                              <div className="flex items-center justify-center p-3 bg-muted/20 border border-border/50 border-dashed rounded-lg text-xs text-muted-foreground">
                                {qData.distribution.Hidden}
                              </div>
                            ) : (
                              <div className="space-y-2 mt-2">
                                {Object.entries(qData.distribution as Record<string, number>).map(([opt, count]) => {
                                  const percentage = (count / maxVal) * 100;
                                  return (
                                    <div key={opt} className="flex items-center gap-3 text-xs">
                                      <span className="w-16 font-medium text-muted-foreground text-right shrink-0">{opt}</span>
                                      <div className="flex-1 h-3.5 bg-muted rounded-full overflow-hidden flex items-center">
                                        <div 
                                          className="h-full bg-emerald-500/80 rounded-full" 
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <span className="w-8 font-semibold text-foreground">{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
