import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createColumnHelper } from "@tanstack/react-table";
import { 
    PageShell, 
    PageHeader,
    Tabs,
    ExportMenu,
    CgDataTable,
    CgBadge
} from "@/components/classgrid";
import { FiPhoneCall, FiUserPlus, FiCheckCircle, FiXCircle } from "react-icons/fi";

const STAGE_COLORS: Record<string, "default" | "primary" | "secondary" | "success" | "destructive" | "warning"> = {
    inquiry: "default",
    contacted: "secondary",
    demo_given: "primary",
    follow_up: "warning",
    converted: "success",
    enrolled: "success",
    dropped: "destructive",
    not_interested: "destructive"
};

const columnHelper = createColumnHelper<any>();

export function LeadTrackingPage() {
    const [selectedHierarchy, setSelectedHierarchy] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<string>("all_stages");

    const token = localStorage.getItem("token") || "";

    const { data: leadsData, isLoading, isError } = useQuery({
        queryKey: ["crm-leads", selectedHierarchy, activeTab],
        queryFn: async () => {
            let url = `/api/crm/leads?limit=100`;
            if (activeTab !== "all_stages") url += `&stage=${activeTab}`;
            if (selectedHierarchy !== "all") url += `&hierarchy_id=${selectedHierarchy}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch leads");
            return res.json();
        }
    });

    const pipelineCounts = useMemo(() => {
        if (!leadsData?.pipeline) return {};
        const counts: Record<string, number> = {};
        leadsData.pipeline.forEach((p: any) => {
            counts[p._id] = p.count;
        });
        return counts;
    }, [leadsData?.pipeline]);

    const columns = useMemo(() => [
        columnHelper.accessor("student_name", {
            header: "Student Name",
            cell: info => <div className="font-semibold">{info.getValue()}</div>
        }),
        columnHelper.accessor("phone", {
            header: "Contact",
            cell: info => (
                <div className="flex items-center gap-2">
                    <FiPhoneCall className="text-muted-foreground w-3 h-3" />
                    <span>{info.getValue()}</span>
                </div>
            )
        }),
        columnHelper.accessor("stage", {
            header: "Pipeline Stage",
            cell: info => {
                const val = info.getValue() as string;
                return (
                    <CgBadge variant={STAGE_COLORS[val] || "default"}>
                        {val.replace(/_/g, " ").toUpperCase()}
                    </CgBadge>
                );
            }
        }),
        columnHelper.accessor("source", {
            header: "Source",
            cell: info => <span className="capitalize text-muted-foreground">{info.getValue()?.replace(/_/g, " ")}</span>
        }),
        columnHelper.accessor("assigned_to", {
            header: "Assigned To",
            cell: info => {
                const user = info.getValue();
                return user ? user.name : <span className="text-muted-foreground italic">Unassigned</span>;
            }
        }),
        columnHelper.accessor("next_follow_up", {
            header: "Next Follow-Up",
            cell: info => {
                const date = info.getValue();
                if (!date) return "-";
                return new Date(date).toLocaleDateString();
            }
        })
    ], []);

    return (
        <PageShell>
            <div className="flex justify-between items-start mb-6">
                <PageHeader 
                    title="Lead Tracking Pipeline" 
                    subtitle="Manage inquiries, track conversions, and follow up with prospective students."
                />
                <div className="flex gap-4">
                    {/* HIERARCHY FILTER TAB (RULE 8) */}
                    <select 
                        className="cg-input bg-card"
                        value={selectedHierarchy}
                        onChange={(e) => setSelectedHierarchy(e.target.value)}
                    >
                        <option value="all">Global (All Divisions)</option>
                        <option value="school">School Division</option>
                        <option value="junior_college">Junior College</option>
                        <option value="engineering">Engineering (CET)</option>
                        <option value="coaching">Coaching Classes</option>
                    </select>
                    {/* EXPORT DATA (RULE 9) */}
                    <ExportMenu onExport={(type) => console.log(`Exporting Leads as ${type}`)} />
                </div>
            </div>

            {/* Pipeline Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div whileHover={{ y: -4 }} className="cg-card p-4 flex flex-col justify-center border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-2 mb-1">
                        <FiUserPlus className="text-blue-500" />
                        <span className="text-sm font-semibold text-muted-foreground">New Inquiries</span>
                    </div>
                    <span className="text-3xl font-bold">{pipelineCounts["inquiry"] || 0}</span>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} className="cg-card p-4 flex flex-col justify-center border-l-4 border-l-orange-500">
                    <div className="flex items-center gap-2 mb-1">
                        <FiPhoneCall className="text-orange-500" />
                        <span className="text-sm font-semibold text-muted-foreground">Follow Up</span>
                    </div>
                    <span className="text-3xl font-bold">{pipelineCounts["follow_up"] || 0}</span>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} className="cg-card p-4 flex flex-col justify-center border-l-4 border-l-green-500">
                    <div className="flex items-center gap-2 mb-1">
                        <FiCheckCircle className="text-green-500" />
                        <span className="text-sm font-semibold text-muted-foreground">Converted</span>
                    </div>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {(pipelineCounts["converted"] || 0) + (pipelineCounts["enrolled"] || 0)}
                    </span>
                </motion.div>
                <motion.div whileHover={{ y: -4 }} className="cg-card p-4 flex flex-col justify-center border-l-4 border-l-red-500">
                    <div className="flex items-center gap-2 mb-1">
                        <FiXCircle className="text-red-500" />
                        <span className="text-sm font-semibold text-muted-foreground">Dropped / Lost</span>
                    </div>
                    <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {(pipelineCounts["dropped"] || 0) + (pipelineCounts["not_interested"] || 0)}
                    </span>
                </motion.div>
            </div>

            {/* Pipeline Stage Tabs */}
            <div className="mb-6">
                <Tabs 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    tabs={[
                        { id: "all_stages", label: "All Leads" },
                        { id: "inquiry", label: "New Inquiry" },
                        { id: "contacted", label: "Contacted" },
                        { id: "follow_up", label: "Follow Ups" },
                        { id: "converted", label: "Converted" },
                        { id: "dropped", label: "Lost/Dropped" }
                    ]} 
                />
            </div>

            {/* Leads Data Table */}
            <motion.div 
                initial={{ opacity: 0, y: 16 }} 
                animate={{ opacity: 1, y: 0 }}
                className="cg-card"
            >
                <CgDataTable 
                    columns={columns} 
                    data={leadsData?.leads || []}
                    isLoading={isLoading}
                    isError={isError}
                    emptyTitle="No Leads Found"
                    emptyDescription={`There are no leads in the '${activeTab.replace(/_/g, " ")}' stage.`}
                />
            </motion.div>
        </PageShell>
    );
}
