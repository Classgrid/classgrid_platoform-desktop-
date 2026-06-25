import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, Award, Loader2, Download, FileSpreadsheet, FileText as FilePdf, ArrowRight, Users } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";






import { getMeritList, generateMerit, getExportUrl, advanceRound, promoteWaitlist } from "../../admissions/api";

const HIERARCHIES = [
  { id: "all",         label: "All Divisions" },
  { id: "school",      label: "School" },
  { id: "jr_college",  label: "Jr. College" },
  { id: "engineering", label: "Engineering" },
  { id: "coaching",    label: "Coaching" },
] as const;

type HierarchyId = typeof HIERARCHIES[number]["id"];

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(200 70% 52%)",
  "hsl(40 90% 55%)",
  "hsl(280 60% 55%)",
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export function MeritListPage() {
  const qc = useQueryClient();
  const [activeHierarchy, setActiveHierarchy] = useState<HierarchyId>("all");
  const [search, setSearch] = useState("");

  const hierarchyParam = activeHierarchy === "all" ? undefined : activeHierarchy;

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["admission-merit-list", hierarchyParam],
    queryFn: () => getMeritList(hierarchyParam),
  });

  const generateMut = useMutation({
    mutationFn: () => generateMerit(hierarchyParam),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-merit-list"] });
    }
  });

  const advanceRoundMut = useMutation({
    mutationFn: advanceRound,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-merit-list"] });
    },
  });

  const waitlistMut = useMutation({
    mutationFn: promoteWaitlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-merit-list"] });
    },
  });

  // Extract applications
  const list = (responseData as any)?.merit_list || (responseData as any)?.applications || [];
  
  // Filter by search
  const filteredList = list.filter((app: any) => 
    app.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    app.en_number?.toLowerCase().includes(search.toLowerCase())
  );

  // ── CHARTS DATA CALCULATION ──
  const { scoreHistogramData, categoryDonutData, topperScore, avgScore, totalCount } = useMemo(() => {
    let currentTopperScore = 0;
    let totalScoreSum = 0;
    
    if (!Array.isArray(list) || list.length === 0) return { scoreHistogramData: [], categoryDonutData: [], topperScore: 0, avgScore: 0, totalCount: 0 };

    const bins: Record<string, number> = {
      "90-100%": 0, "80-89%": 0, "70-79%": 0, "60-69%": 0, "50-59%": 0, "<50%": 0
    };

    const catCounts: Record<string, number> = {};
    let topperScore = 0;
    let totalScore = 0;

    list?.forEach((app: any) => {
      const score = app.merit_score || 0;
      if (score >= 90) bins["90-100%"] = (bins["90-100%"] ?? 0) + 1;
      else if (score >= 80) bins["80-89%"] = (bins["80-89%"] ?? 0) + 1;
      else if (score >= 70) bins["70-79%"] = (bins["70-79%"] ?? 0) + 1;
      else if (score >= 60) bins["60-69%"] = (bins["60-69%"] ?? 0) + 1;
      else if (score >= 50) bins["50-59%"] = (bins["50-59%"] ?? 0) + 1;
      else bins["<50%"] = (bins["<50%"] ?? 0) + 1;

      const cat = app.category || "General";
      catCounts[cat] = (catCounts[cat] || 0) + 1;

      if (score > currentTopperScore) currentTopperScore = score;
      totalScoreSum += score;
    });

    const histData = Object.entries(bins).map(([range, count]) => ({ range, count }));
    const donutData = Object.entries(catCounts).map(([name, value], i) => ({
      name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    }));


    return { scoreHistogramData: histData, categoryDonutData: donutData, topperScore, avgScore: list.length > 0 ? totalScore / list.length : 0, totalCount: list.length };
  }, [list]);


  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "merit_rank",
      header: "Rank",
      cell: ({ row }) => (
        <span className="font-bold text-lg w-8 inline-block text-center text-primary">
          #{row.original.merit_rank || (row.index + 1)}
        </span>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Candidate Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div name={row.original.full_name} size="sm" />
          <div>
            <div className="font-medium">{row.original.full_name}</div>
            {row.original.en_number && <div className="text-xs text-muted-foreground font-mono">EN: {row.original.en_number}</div>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "merit_score",
      header: "Score %",
      cell: ({ row }) => (
        <span className="font-medium text-foreground bg-accent/10 px-2 py-1 rounded">
          {row.original.merit_score ? `${row.original.merit_score.toFixed(2)}%` : "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const variant = s === "allotted" || s === "enrolled" ? "success" : s === "rejected" ? "danger" : "info";
        return <div variant={variant}>{s.replace("_", " ")}</div>;
      },
    },
  ];

  return (
    <div
      title="Merit Lists & Generation"
      description="Calculate merit scores, assign ranks, and manage round allotments."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Merit Lists" }
      ]}
      actions={
        <div className="flex gap-2">
          <ExportMenu
            onExportCsv={() => console.log('Exporting csv...')}
            onExportExcel={() => console.log('Exporting excel...')}
            onExportPdf={() => console.log('Exporting pdf...')}
          />
          <button
            onClick={() => advanceRoundMut.mutate()}
            disabled={advanceRoundMut.isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            {advanceRoundMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Advance Round
          </button>
          <button
            onClick={() => waitlistMut.mutate()}
            disabled={waitlistMut.isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            {waitlistMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Promote Waitlist
          </button>
          <button
            onClick={() => generateMut.mutate()}
            disabled={generateMut.isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow"
          >
            {generateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            Generate Rank List
          </button>
        </div>
      }
    >
      <div className="">
        {HIERARCHIES.map(h => (
          <button
            key={h.id}
            onClick={() => setActiveHierarchy(h.id)}
            className={`${activeHierarchy === h.id ? " " : ""}`}
          >
            {h.label}
            {activeHierarchy === h.id && (
              <motion.span className="" layoutId="hierarchy-indicator" />
            )}
          </button>
        ))}
      </div>

      {isError && <div variant="danger" title="Error">Failed to load merit list.</div>}
      {(advanceRoundMut.isSuccess || waitlistMut.isSuccess) && (
        <div variant="success" title="Success">
          {advanceRoundMut.isSuccess ? "Round advanced successfully." : "Waitlist students promoted."}
        </div>
      )}

      {/* ── Metric Cards ── */}
      <motion.div className=" mb-6" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="Total Ranked" value={totalCount} icon={<Award className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Topper Score" value={`${topperScore.toFixed(1)}%`} icon={<Calculator className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Average Score" value={`${avgScore.toFixed(1)}%`} icon={<Users className="w-5 h-5" />} />
        </motion.div>
      </motion.div>
      <motion.div className=" mb-6" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="📊 Score Distribution Histogram" description="Count of students in specific merit score ranges.">
            {isLoading ? (
              <div className=""><Loader2 className="animate-spin" /></div>
            ) : scoreHistogramData.length > 0 ? (
              <div 
                data={scoreHistogramData} 
                indexKey="range" 
                series={[{ key: "count", color: "hsl(var(--accent))", name: "Students" }]} 
                height={260} 
              />
            ) : (
              <div title="No data" description="Generate merit list to view distribution." />
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div title="🥧 Category Breakdown" description="Reservation category split in the current rank list.">
            {isLoading ? (
              <div className=""><Loader2 className="animate-spin" /></div>
            ) : categoryDonutData.length > 0 ? (
              <div data={categoryDonutData as any} height={260} />
            ) : (
              <div title="No data" description="Generate merit list to view breakdown." />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ── DATA TABLE ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div title="Merit Rank Database" noPadding>
          <div className="flex items-center gap-2 p-2 border-b border-border flex justify-between items-center bg-card border-b border-border p-3">
            <div
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search rank list by name or EN..."
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted/50 px-3 py-1.5 rounded-full border border-border">
              <Award className="w-4 h-4 text-primary" />
              <span>{filteredList.length} Ranked Candidates</span>
            </div>
          </div>
          
          {isLoading ? (
            <div className=""><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div
              columns={columns}
              data={filteredList}
              pageSize={20}
              emptyMessage="No merit list generated for this division yet."
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
