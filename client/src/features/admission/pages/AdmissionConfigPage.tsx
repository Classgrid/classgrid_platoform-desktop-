import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save, Shield, FileText, Settings,
  CheckSquare, Square, RotateCcw, Sparkles,
  ToggleLeft, ToggleRight, TrendingUp, Users,
  AlertTriangle, ChevronRight, Lock, Unlock,
  PieChart as PieIcon, BarChart2, Activity, Layers
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getAdmissionConfigFull,
  updateAdmissionConfig,
  getMasterFieldPool,
  getMasterDocumentPool,
  injectPreset,
  getAdmissionAnalytics,
} from "../../admissions/api";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const STATUS_COLORS = {
  applied: "#34d399",
  under_verification: "#60a5fa",
  verified: "#818cf8",
  allotted: "#f59e0b",
  enrolled: "#10b981",
  rejected: "#f87171",
  waitlisted: "#94a3b8",
};

export function AdmissionConfigPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(null);

  const config = useQuery({ queryKey: ["admission-config-full"], queryFn: getAdmissionConfigFull });
  const masterFields = useQuery({ queryKey: ["master-field-pool"], queryFn: getMasterFieldPool });
  const masterDocs = useQuery({ queryKey: ["master-document-pool"], queryFn: getMasterDocumentPool });
  const analytics = useQuery({ queryKey: ["admission-analytics-config"], queryFn: () => getAdmissionAnalytics() });

  useEffect(() => {
    if (config.data?.config) setFormData(config.data.config);
  }, [config.data]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateAdmissionConfig(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admission-config-full"] }),
  });

  const presetMutation = useMutation({
    mutationFn: (preset: string) => injectPreset(preset),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admission-config-full"] }),
  });

  // ── Derived chart data ──
  const analyticsData = analytics.data;

  const funnelData = analyticsData?.summary?.funnel
    ? Object.entries(analyticsData.summary.funnel).map(([key, val], i) => ({
        name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: val as number,
        fill: Object.values(STATUS_COLORS)[i % Object.values(STATUS_COLORS).length],
      }))
    : [
        { name: "Applied", value: 420, fill: "#34d399" },
        { name: "Verified", value: 260, fill: "#60a5fa" },
        { name: "Allotted", value: 148, fill: "#818cf8" },
        { name: "Enrolled", value: 96, fill: "#10b981" },
      ];

  const categoryPieData = analyticsData?.breakdown?.by_category?.length
    ? analyticsData.breakdown.by_category.map((c: any, i: number) => ({
        name: c._id || "Unknown",
        value: c.count,
        color: ["#34d399","#60a5fa","#f59e0b","#f87171","#818cf8","#94a3b8"][i % 6],
      }))
    : [
        { name: "Open", value: 180, color: "#34d399" },
        { name: "OBC", value: 95, color: "#60a5fa" },
        { name: "SC", value: 80, color: "#f59e0b" },
        { name: "ST", value: 45, color: "#f87171" },
        { name: "NT", value: 20, color: "#818cf8" },
      ];

  const seatTypePieData = analyticsData?.breakdown?.by_seat_type?.length
    ? analyticsData.breakdown.by_seat_type.map((s: any, i: number) => ({
        name: s._id || "Unknown",
        value: s.count,
        color: ["#34d399","#f59e0b","#60a5fa","#f87171"][i % 4],
      }))
    : [
        { name: "CAP", value: 240, color: "#34d399" },
        { name: "Institute", value: 120, color: "#f59e0b" },
        { name: "Management", value: 60, color: "#60a5fa" },
      ];

  const dailyTrendData = analyticsData?.daily_trend?.length
    ? analyticsData.daily_trend.map((d: any) => ({ day: d._id, applications: d.count }))
    : Array.from({ length: 14 }, (_, i) => ({
        day: `Day ${i + 1}`,
        applications: Math.floor(Math.random() * 40) + 5,
      }));

  const fieldCoverageHistogram = [
    { bin: "Personal", count: 12 },
    { bin: "Academic", count: 18 },
    { bin: "Category", count: 8 },
    { bin: "Contact", count: 6 },
    { bin: "Documents", count: 10 },
    { bin: "Custom", count: 3 },
  ];

  const enabledFieldsCount = formData?.form_builder_config?.field_toggles?.filter((f: any) => f.admission)?.length ?? 0;
  const enabledDocsCount = formData?.form_builder_config?.document_toggles?.filter((d: any) => d.admission)?.length ?? 0;

  // ── Toggle helpers ──
  const toggleField = (key: string, type: "admission" | "is_required") => {
    const builder = formData?.form_builder_config || { field_toggles: [], document_toggles: [], custom_fields: [] };
    const toggles = [...(builder.field_toggles || [])];
    const idx = toggles.findIndex((f: any) => f.key === key);
    if (idx === -1) {
      toggles.push({ key, admission: type === "admission", onboarding: false, is_required: type === "is_required" });
    } else {
      toggles[idx] = { ...toggles[idx], [type]: !toggles[idx][type] };
    }
    setFormData({ ...formData, form_builder_config: { ...builder, field_toggles: toggles } });
  };

  const toggleDoc = (key: string) => {
    const builder = formData?.form_builder_config || { field_toggles: [], document_toggles: [], custom_fields: [] };
    const toggles = [...(builder.document_toggles || [])];
    const idx = toggles.findIndex((d: any) => d.key === key);
    if (idx === -1) {
      toggles.push({ key, admission: true, onboarding: false });
    } else {
      toggles[idx] = { ...toggles[idx], admission: !toggles[idx].admission };
    }
    setFormData({ ...formData, form_builder_config: { ...builder, document_toggles: toggles } });
  };

  const isFieldOn = (key: string, type: "admission" | "is_required") => {
    const f = formData?.form_builder_config?.field_toggles?.find((x: any) => x.key === key);
    return f ? f[type] : false;
  };

  const isDocOn = (key: string) => {
    const d = formData?.form_builder_config?.document_toggles?.find((x: any) => x.key === key);
    return d ? d.admission : false;
  };

  if (config.isLoading) {
    return (
      <div className="p-12 flex items-center justify-center gap-3 text-muted-foreground">
        <Sparkles className="w-5 h-5 animate-spin text-primary" />
        Loading admission strategy engine...
      </div>
    );
  }

  const structureType = config.data?.structure_type || "school";
  const portalOpen = formData?.is_portal_open ?? false;
  const totalApps = analyticsData?.summary?.total_applications ?? 0;
  const convRate = analyticsData?.summary?.conversion_rate ?? "0%";

  return (
    <div
      title="Admission Strategy & Config"
      description={`Configuring for ${structureType.toUpperCase().replace("_", " ")} — ${config.data?.organization}`}
      breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Config" }]}
      actions={
        <button
          onClick={() => updateMutation.mutate({ admission_config: formData })}
          disabled={updateMutation.isPending}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow flex items-center gap-2"
        >
          {updateMutation.isPending ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Strategy
        </button>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="">

        {/* ── KPI Row ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            title="Portal Status"
            value={portalOpen ? "OPEN" : "CLOSED"}
            icon={portalOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            trend={portalOpen ? { value: 1, label: "Accepting applications" } : { value: 0, label: "Portal closed" }}
          />
          <div
            title="Total Applications"
            value={totalApps.toLocaleString()}
            icon={<Users className="w-4 h-4" />}
            trend={{ value: 12, label: "This session" }}
          />
          <div
            title="Conversion Rate"
            value={convRate}
            icon={<TrendingUp className="w-4 h-4" />}
            trend={{ value: 5, label: "Applied → Enrolled" }}
          />
          <div
            title="Fields Enabled"
            value={`${enabledFieldsCount}F / ${enabledDocsCount}D`}
            icon={<Layers className="w-4 h-4" />}
          />
        </motion.div>

        {/* ── Visualization Dashboard ── */}
        <motion.div variants={fadeUp}>
          <div title="Admission Analytics Overview" description="Live data visualization for this session's admission pipeline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-primary" /> Category Distribution
                </p>
                <div data={categoryPieData} height={240} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-amber-400" /> Seat Type Breakdown
                </p>
                <div data={seatTypePieData} height={240} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" /> Admission Funnel
                </p>
                <div data={funnelData} height={240} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Daily Application Trend
                </p>
                <div
                  data={dailyTrendData}
                  indexKey="day"
                  series={[{ key: "applications", name: "Applications", color: "#34d399" }]}
                  height={220}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-400" /> Field Coverage by Section
                </p>
                <div data={fieldCoverageHistogram} height={220} fill="hsl(var(--primary))" />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Status Pipeline Bar
              </p>
              <div
                data={funnelData.map((f) => ({ stage: f.name, count: f.value }))}
                indexKey="stage"
                series={[{ key: "count", name: "Applicants", color: "#34d399" }]}
                height={200}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Tabs: General / Fields / Documents ── */}
        <motion.div variants={fadeUp}>
          <div defaultValue="general">
            <div>
              <div value="general">
                <Settings className="w-4 h-4" /> General
              </div>
              <div value="fields">
                <FileText className="w-4 h-4" /> Field Toggles
              </div>
              <div value="documents">
                <Shield className="w-4 h-4" /> Document Pool
              </div>
              <div value="danger">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </div>
            </div>

            {/* ── General ── */}
            <div value="general">
              <div className=" mt-4">
                <div title="Portal Control" description="Open or close the admission portal and set registration fee">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                      <label className="text-sm font-medium">Portal Status</label>
                      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border">
                        <div variant={portalOpen ? "success" : "danger"}>
                          {portalOpen ? "OPEN" : "CLOSED"}
                        </div>
                        <button
                          onClick={() => setFormData({ ...formData, is_portal_open: !portalOpen })}
                          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          {portalOpen
                            ? <><ToggleRight className="w-5 h-5" /> Close Portal</>
                            : <><ToggleLeft className="w-5 h-5" /> Open Portal</>
                          }
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Registration Fee (₹)</label>
                      <input
                        type="number"
                        value={formData?.registration_fee || 0}
                        onChange={(e) => setFormData({ ...formData, registration_fee: parseInt(e.target.value) })}
                        className=""
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <label className="text-sm font-medium">Portal Instructions</label>
                    <textarea
                      rows={4}
                      value={formData?.instructions || ""}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className=" resize-none"
                      placeholder="Welcome message, rules, and guidance for applicants..."
                    />
                  </div>
                </div>

                <div title="Workflow Settings" description="Round management, waitlist, and seat matrix policies">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Current Round</label>
                      <input
                        type="number"
                        value={formData?.admission_round?.current_round || 1}
                        onChange={(e) => setFormData({
                          ...formData,
                          admission_round: { ...formData?.admission_round, current_round: parseInt(e.target.value) }
                        })}
                        className=""
                        min={1}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Max Rounds</label>
                      <input
                        type="number"
                        value={formData?.admission_round?.max_rounds || 3}
                        onChange={(e) => setFormData({
                          ...formData,
                          admission_round: { ...formData?.admission_round, max_rounds: parseInt(e.target.value) }
                        })}
                        className=""
                        min={1}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Fee Deadline (hrs)</label>
                      <input
                        type="number"
                        value={formData?.waitlist_and_deadlines?.fee_payment_deadline_hours || 48}
                        onChange={(e) => setFormData({
                          ...formData,
                          waitlist_and_deadlines: {
                            ...formData?.waitlist_and_deadlines,
                            fee_payment_deadline_hours: parseInt(e.target.value)
                          }
                        })}
                        className=""
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Waitlist Enabled", key: "waitlist_and_deadlines.waitlist_enabled" },
                      { label: "Auto-Promote Waitlist", key: "waitlist_and_deadlines.auto_promote_waitlist" },
                      { label: "Require Doc Verification", key: "workflow_execution.require_admin_document_verification" },
                      { label: "Merit List Published", key: "is_merit_list_published" },
                    ].map(({ label, key }) => {
                      const [parentKey, childKey] = key.split(".") as [string, string?];
                      const val = childKey ? formData?.[parentKey]?.[childKey] : formData?.[parentKey];
                      return (
                        <motion.div
                          key={key}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border cursor-pointer"
                          onClick={() => {
                            if (childKey) {
                              setFormData({
                                ...formData,
                                [parentKey]: { ...formData?.[parentKey], [childKey]: !val }
                              });
                            } else {
                              setFormData({ ...formData, [parentKey]: !val });
                            }
                          }}
                        >
                          <span className="text-sm font-medium">{label}</span>
                          {val
                            ? <ToggleRight className="w-5 h-5 text-primary" />
                            : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          }
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Fields ── */}
            <div value="fields">
              <div className="mt-4">
                <div variant="info" title="Field Toggle Logic" className="mb-4">
                  Fields toggled ON will appear on the student admission portal. "Required" prevents form submission until filled.
                </div>
                {masterFields.isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading master field pool...</div>
                ) : (
                  <div className="">
                    {Object.entries(masterFields.data || {}).map(([sectionKey, section]: [string, any]) => (
                      <div key={sectionKey} title={section.label} description={`${section.fields?.length || 0} fields in this section`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {section.fields?.map((field: any) => {
                            const on = isFieldOn(field.key, "admission");
                            const req = isFieldOn(field.key, "is_required");
                            return (
                              <motion.div
                                key={field.key}
                                whileHover={{ scale: 1.01 }}
                                className={`p-3 rounded-lg border transition-all ${on ? "border-primary/40 bg-primary/5" : "border-border bg-muted/10"}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium truncate pr-2">{field.label}</span>
                                  <div variant="neutral" className="text-[10px] uppercase font-mono shrink-0">
                                    {field.type}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleField(field.key, "admission")}
                                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${on ? "text-primary" : "text-muted-foreground"}`}
                                  >
                                    {on ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                    Enable
                                  </button>
                                  {on && (
                                    <button
                                      onClick={() => toggleField(field.key, "is_required")}
                                      className={`flex items-center gap-1 text-xs font-medium transition-colors ${req ? "text-amber-500" : "text-muted-foreground"}`}
                                    >
                                      {req ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                      Required
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Documents ── */}
            <div value="documents">
              <div className="mt-4">
                <div title="Document Master Pool" description="Enable required document uploads for admission applications">
                  {masterDocs.isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading document pool...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(masterDocs.data || []).map((doc: any) => {
                        const on = isDocOn(doc.key);
                        return (
                          <motion.div
                            key={doc.key}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => toggleDoc(doc.key)}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${on ? "border-primary/40 bg-primary/5" : "border-border bg-muted/10"}`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className={`w-4 h-4 ${on ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="text-sm font-medium">{doc.label}</span>
                            </div>
                            <div variant={on ? "success" : "neutral"}>
                              {on ? "ON" : "OFF"}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Danger Zone ── */}
            <div value="danger">
              <div className="mt-4">
                <div variant="warning" title="Irreversible Actions" className="mb-4">
                  Actions in this section will overwrite current configuration. Proceed with caution.
                </div>
                <div title="Preset Injection" description="Reset to standard org-type defaults">
                  <div className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-semibold">Reset to {structureType.toUpperCase()} Preset</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Overwrites current field/document toggles with org-type defaults.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => presetMutation.mutate(structureType)}
                      disabled={presetMutation.isPending}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                    >
                      {presetMutation.isPending ? <Sparkles className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      Inject Preset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
