import React, { useState } from "react";
import { Loader, Plus, AlertCircle, CheckCircle, Lock, UploadCloud, Play, Download } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { useSchemes, useSaveScheme, useDeleteScheme, useGenerateResults, usePublishResults, useLockScheme, ResultScheme } from "../queries/useResultSchemes";

export function ResultsProcessingPage() {
  const { data: schemes, isLoading } = useSchemes();
  const [activeTab, setActiveTab] = useState<"schemes" | "subjects" | "upload" | "generate">("schemes");
  const [selectedScheme, setSelectedScheme] = useState<ResultScheme | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader size={36} className="animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading Result Schemes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-end mb-4 border-b border-border pb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Examination Cell</p>
          <h1 className="text-2xl font-bold tracking-tight">Results Processing</h1>
        </div>
        {activeTab === "schemes" && (
          <Button>
            <Plus size={16} className="mr-2" />
            Create Scheme
          </Button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border mt-6">
        {["schemes", "subjects", "upload", "generate"].map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "schemes" && <SchemesList schemes={schemes || []} onSelect={setSelectedScheme} />}
        {activeTab === "subjects" && <SubjectsManager scheme={selectedScheme} />}
        {activeTab === "upload" && <MarksUpload scheme={selectedScheme} />}
        {activeTab === "generate" && <GenerationEngine scheme={selectedScheme} />}
      </div>
    </div>
  );
}

// -----------------------------------------------------
// SUB-COMPONENTS (We will expand these as requested)
// -----------------------------------------------------

function SchemesList({ schemes, onSelect }: { schemes: ResultScheme[]; onSelect: (s: ResultScheme) => void }) {
  if (!schemes.length) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-card">
        <p className="text-muted-foreground">No result schemes found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schemes.map((scheme) => (
        <div key={scheme.id} className="bg-card border border-border rounded-xl shadow-sm p-4 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onSelect(scheme)}>
          <div>
            <h3 className="font-semibold text-lg">{scheme.name}</h3>
            <p className="text-sm text-muted-foreground">
              {scheme.academic_year} • Semester {scheme.semester} • Mode: <span className="uppercase text-primary">{scheme.rules_json?.mode || "college"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
              scheme.status === "published" ? "bg-success/10 text-success border-success/20" :
              scheme.status === "locked" ? "bg-danger/10 text-danger border-danger/20" :
              "bg-secondary text-secondary-foreground border-border"
            }`}>
              {scheme.status.toUpperCase()}
            </span>
            <Button variant="outline" size="sm">Select</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubjectsManager({ scheme }: { scheme: ResultScheme | null }) {
  if (!scheme) return <div className="p-4 text-center text-muted-foreground">Please select a scheme from the Schemes tab first.</div>;
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Subjects for {scheme.name}</h2>
      <p className="text-sm text-muted-foreground mb-4">You can add theory and lab subjects with their respective credits here.</p>
      {/* Real form for subjects will go here */}
      <div className="border border-dashed rounded-lg p-8 text-center bg-background/50">
        <p>Subject manager UI connects to /api/results/schemes/:id/subjects</p>
      </div>
    </div>
  );
}

function MarksUpload({ scheme }: { scheme: ResultScheme | null }) {
  if (!scheme) return <div className="p-4 text-center text-muted-foreground">Please select a scheme from the Schemes tab first.</div>;
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Upload Marks: {scheme.name}</h2>
      <div className="border-2 border-dashed border-primary/20 rounded-lg p-12 text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
        <UploadCloud className="mx-auto h-12 w-12 text-primary/60 mb-4" />
        <h3 className="text-lg font-medium">Drag & Drop CSV File</h3>
        <p className="text-sm text-muted-foreground mt-2">Columns must match Subject Codes exactly. Include 'PRN' column.</p>
      </div>
    </div>
  );
}

function GenerationEngine({ scheme }: { scheme: ResultScheme | null }) {
  const generateMutation = useGenerateResults();
  
  if (!scheme) return <div className="p-4 text-center text-muted-foreground">Please select a scheme from the Schemes tab first.</div>;
  
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold mb-2">Result Processing Engine</h2>
        <p className="text-muted-foreground mb-6 max-w-lg">
          This will process all uploaded marks, apply relative/absolute grading, calculate SGPA/CGPA for engineering, and determine the Pass/Fail status for {scheme.name}.
        </p>
        
        <Button 
          size="lg" 
          className="w-full max-w-sm h-14 text-lg"
          onClick={() => generateMutation.mutate(scheme.id)}
          disabled={generateMutation.isPending || scheme.is_generating}
        >
          <Play className="mr-2" />
          Generate Results
        </Button>
        
        {scheme.last_student_count > 0 && (
          <p className="mt-4 text-sm text-success flex items-center">
            <CheckCircle size={16} className="mr-1" />
            Last generation processed {scheme.last_student_count} students in {scheme.generation_time_seconds}s.
          </p>
        )}
      </div>
    </div>
  );
}
