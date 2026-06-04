import React from "react";
import { CgTabs, CgTabContent, CgTabList, CgTabTrigger } from "@/components/classgrid/Tabs";
import { Users, BookOpen, FileText, ShieldCheck } from "lucide-react";
import { useStudentFamilyInfo, useStudentQualifications, useStudentDocuments } from "../../queries/useSettingsQueries";

export function ProfileStudentExtendedTabs() {
  const { data: familyInfo, isLoading: familyLoading } = useStudentFamilyInfo();
  const { data: qualifications, isLoading: qualLoading } = useStudentQualifications();
  const { data: documents, isLoading: docLoading } = useStudentDocuments();

  return (
    <div className="cg-bento-card mt-6">
      <CgTabs defaultValue="family">
        <CgTabList className="w-full justify-start border-b border-border rounded-none bg-transparent h-12 mb-4">
          <CgTabTrigger value="family" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12">
            <Users size={16} className="mr-2" /> Family Info
          </CgTabTrigger>
          <CgTabTrigger value="qualifications" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12">
            <BookOpen size={16} className="mr-2" /> Past Qualifications
          </CgTabTrigger>
          <CgTabTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12">
            <FileText size={16} className="mr-2" /> Documents
          </CgTabTrigger>
          <CgTabTrigger value="compliance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12">
            <ShieldCheck size={16} className="mr-2" /> Compliance
          </CgTabTrigger>
        </CgTabList>

        <CgTabContent value="family" className="p-2">
          {familyLoading ? <div className="text-sm text-muted-foreground animate-pulse">Loading family details...</div> : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex flex-col gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Father's Name</span>
                 <span className="text-sm font-medium">{familyInfo?.father_name || "Not provided"}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mother's Name</span>
                 <span className="text-sm font-medium">{familyInfo?.mother_name || "Not provided"}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parent Contact</span>
                 <span className="text-sm font-medium">{familyInfo?.parent_contact || "Not provided"}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Emergency Contact</span>
                 <span className="text-sm font-medium">{familyInfo?.emergency_contact || "Not provided"}</span>
               </div>
             </div>
          )}
        </CgTabContent>

        <CgTabContent value="qualifications" className="p-2">
           {qualLoading ? <div className="text-sm text-muted-foreground animate-pulse">Loading qualifications...</div> : (
              qualifications?.length ? (
                <div className="flex flex-col gap-4">
                  {qualifications.map((q: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{q.qual_type}</span>
                        <span className="text-sm font-medium text-success">{q.marks}%</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{q.board}</span>
                        <span>•</span>
                        <span>{q.passing_year}</span>
                        {q.stream && <span>•</span>}
                        {q.stream && <span>{q.stream}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-6">No past qualifications added yet.</div>
              )
           )}
        </CgTabContent>

        <CgTabContent value="documents" className="p-2">
           {docLoading ? <div className="text-sm text-muted-foreground animate-pulse">Loading documents...</div> : (
              documents?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((d: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-primary/10 text-primary">
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-medium">{d.doc_type}</span>
                      </div>
                      <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View</a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet.</div>
              )
           )}
        </CgTabContent>

        <CgTabContent value="compliance" className="p-2">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-sm">
               Compliance module (ABC ID, Anti-Ragging) is managed via the admission portal.
            </div>
        </CgTabContent>
      </CgTabs>
    </div>
  );
}
