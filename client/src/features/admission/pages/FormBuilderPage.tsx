import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save, Plus, Trash2, LayoutTemplate, CheckSquare,
  FileText, Loader2, Sparkles, Settings, Eye,
  Type, Calendar, List, CheckCircle2, AlertCircle,
  TrendingUp, BarChart2, PieChart as PieIcon, Activity
} from "lucide-react";
import {
  CgPageShell, CgSectionPanel, CgAlert, CgBadge,
  CgMetricCard, CgSelect, CgTabs, CgTabList,
  CgTabTrigger, CgTabContent, CgPieChart,
  CgDonutChart, CgBarChart, CgLineChart, CgHistogram
} from "@/components/classgrid";
import { Button as CgButton } from "@/components/classgrid/Button";
import {
  getAdmissionConfigFull,
  updateAdmissionConfig,
  getMasterFieldPool,
  getMasterDocumentPool
} from "../../admissions/api";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

export function FormBuilderPage() {
  const qc = useQueryClient();

  // Local state
  const [fieldToggles, setFieldToggles] = useState<any[]>([]);
  const [docToggles, setDocToggles] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("personal");

  // Fetch Data
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["admission-config-full"],
    queryFn: getAdmissionConfigFull,
  });

  const { data: masterFields, isLoading: fieldsLoading } = useQuery({
    queryKey: ["master-field-pool"],
    queryFn: getMasterFieldPool,
  });

  const { data: masterDocs, isLoading: docsLoading } = useQuery({
    queryKey: ["master-doc-pool"],
    queryFn: getMasterDocumentPool,
  });

  useEffect(() => {
    if (configData?.config?.form_builder_config) {
      const fbConfig = configData.config.form_builder_config;
      setFieldToggles(fbConfig.field_toggles || []);
      setDocToggles(fbConfig.document_toggles || []);
      setCustomFields(fbConfig.custom_fields || []);
    }
  }, [configData]);

  const saveMutation = useMutation({
    mutationFn: (updatedConfig: any) => updateAdmissionConfig({ admission_config: updatedConfig }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-config-full"] });
    }
  });

  const handleSave = () => {
    if (!configData?.config) return;

    const newConfig = {
      ...configData.config,
      form_builder_config: {
        field_toggles: fieldToggles,
        document_toggles: docToggles,
        custom_fields: customFields
      }
    };

    saveMutation.mutate(newConfig);
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        field_key: `custom_${Date.now()}`,
        field_label: "",
        field_type: "text",
        options: [],
        is_required: false,
        section: "additional_info",
        admission: true,
        onboarding: true
      }
    ]);
  };

  const removeCustomField = (idx: number) => {
    setCustomFields(customFields.filter((_, i) => i !== idx));
  };

  const updateToggle = (key: string, field: string, value: boolean) => {
    const existing = [...fieldToggles];
    const idx = existing.findIndex(t => t.key === key);
    if (idx > -1) {
      existing[idx][field] = value;
    } else {
      existing.push({ 
        key, 
        admission: field === 'admission' ? value : false, 
        onboarding: field === 'onboarding' ? value : false, 
        is_required: field === 'is_required' ? value : false 
      });
    }
    setFieldToggles(existing);
  };

  const updateDocToggle = (key: string, field: string, value: boolean) => {
    const existing = [...docToggles];
    const idx = existing.findIndex(t => t.key === key);
    if (idx > -1) {
      existing[idx][field] = value;
    } else {
      existing.push({ 
        key, 
        admission: field === 'admission' ? value : false, 
        onboarding: field === 'onboarding' ? value : false 
      });
    }
    setDocToggles(existing);
  };

  if (configLoading || fieldsLoading || docsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 cg-spin text-primary" />
          <p className="text-muted-foreground font-medium">Initializing Form Engine...</p>
        </div>
      </div>
    );
  }

  // Analytics Derivation
  const totalFields = fieldToggles.filter(f => f.admission).length + customFields.filter(f => f.admission).length;
  const requiredFields = fieldToggles.filter(f => f.admission && f.is_required).length + customFields.filter(f => f.admission && f.is_required).length;
  const totalDocs = docToggles.filter(d => d.admission).length;

  const categories = Object.keys(masterFields || {});
  
  // Pie Chart Data: Fields per Category
  const pieData = categories.map((cat, i) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: (masterFields[cat] || []).filter((f: any) => fieldToggles.find(t => t.key === f.key && t.admission)).length,
    color: i === 0 ? "#34d399" : i === 1 ? "#60a5fa" : i === 2 ? "#fbbf24" : i === 3 ? "#f87171" : "#a78bfa"
  })).filter(d => d.value > 0);

  // Donut Chart: Required vs Optional
  const donutData = [
    { name: "Required", value: requiredFields, color: "#10b981" },
    { name: "Optional", value: totalFields - requiredFields, color: "#94a3b8" }
  ];

  // Bar Chart: Fields by Type
  const typeCounts: Record<string, number> = {};
  categories.forEach(cat => {
    (masterFields[cat] || []).forEach((f: any) => {
      if (fieldToggles.find(t => t.key === f.key && t.admission)) {
        typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
      }
    });
  });
  customFields.forEach(f => {
    if (f.admission) typeCounts[f.field_type] = (typeCounts[f.field_type] || 0) + 1;
  });

  const barData = Object.entries(typeCounts).map(([type, count]) => ({
    type: type.toUpperCase(),
    count
  }));

  // Histogram: Field Weights (Mocked by category size)
  const histData = categories.map(cat => ({
    bin: cat.substring(0, 3).toUpperCase(),
    count: (masterFields[cat] || []).length
  }));

  // Line Chart: Complexity Trend (mocked based on category order)
  const lineData = categories.map((cat, i) => ({
    step: cat,
    fields: (masterFields[cat] || []).length
  }));

  return (
    <CgPageShell
      title="Dynamic Form Builder"
      description="Design the candidate experience. Toggle fields, set requirements, and add custom institutional questions."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Configuration" },
        { label: "Form Builder" }
      ]}
      actions={
        <div className="flex gap-3">
          <CgButton variant="outline" className="gap-2">
            <Eye className="w-4 h-4" /> Preview Portal
          </CgButton>
          <CgButton onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Sparkles className="w-4 h-4 cg-spin" /> : <Save className="w-4 h-4" />}
            Publish Changes
          </CgButton>
        </div>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="cg-grid-1col">
        
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CgMetricCard 
            title="Total Form Fields" 
            value={totalFields.toString()} 
            icon={<LayoutTemplate className="w-4 h-4" />}
            trend={{ value: 12, label: "from default" }}
          />
          <CgMetricCard 
            title="Required Fields" 
            value={requiredFields.toString()} 
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <CgMetricCard 
            title="Required Documents" 
            value={totalDocs.toString()} 
            icon={<FileText className="w-4 h-4 text-blue-500" />}
          />
          <CgMetricCard 
            title="Custom Questions" 
            value={customFields.length.toString()} 
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* ── Analytics Visualizations ── */}
        <CgSectionPanel title="Form Structure Analytics" description="Visual breakdown of your admission form complexity and data coverage.">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <PieIcon className="w-4 h-4" /> Category Distribution
              </p>
              <CgPieChart data={pieData.length ? pieData : [{ name: "No Fields", value: 1, color: "#333" }]} height={240} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <PieIcon className="w-4 h-4" /> Compliance Ratio
              </p>
              <CgDonutChart data={donutData} height={240} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Field Type Mix
              </p>
              <CgBarChart 
                data={barData.length ? barData : [{ type: "N/A", count: 0 }]} 
                indexKey="type" 
                series={[{ key: "count", name: "Field Count", color: "#60a5fa" }]} 
                height={240} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Section Complexity (Fields per Category)
              </p>
              <CgLineChart 
                data={lineData} 
                indexKey="step" 
                series={[{ key: "fields", name: "Fields", color: "#34d399" }]} 
                height={200} 
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Master Pool Density
              </p>
              <CgHistogram data={histData} height={200} fill="#818cf8" />
            </div>
          </div>
        </CgSectionPanel>

        {/* ── Main Builder Interface ── */}
        <CgTabs defaultValue="fields">
          <CgTabList>
            <CgTabTrigger value="fields">
              <Type className="w-4 h-4" /> Standard Fields
            </CgTabTrigger>
            <CgTabTrigger value="documents">
              <FileText className="w-4 h-4" /> Document Checklist
            </CgTabTrigger>
            <CgTabTrigger value="custom">
              <Sparkles className="w-4 h-4" /> Custom Builder
            </CgTabTrigger>
            <CgTabTrigger value="settings">
              <Settings className="w-4 h-4" /> Form Rules
            </CgTabTrigger>
          </CgTabList>

          <CgTabContent value="fields" className="mt-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Category Sidebar */}
              <div className="col-span-12 md:col-span-3 space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                      activeCategory === cat 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                    <CgBadge variant={activeCategory === cat ? "neutral" : "neutral"} className={activeCategory === cat ? "bg-white/20 text-white" : ""}>
                      {(masterFields[cat] || []).length}
                    </CgBadge>
                  </button>
                ))}
              </div>

              {/* Fields Table */}
              <div className="col-span-12 md:col-span-9">
                <CgSectionPanel 
                  title={`${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1).replace(/_/g, " ")} Fields`}
                  description="Configure visibility and requirement rules for this section."
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-3">
                      <div className="col-span-5">Field Identifier</div>
                      <div className="col-span-2 text-center">Type</div>
                      <div className="col-span-1.5 text-center">Visible</div>
                      <div className="col-span-1.5 text-center">Required</div>
                      <div className="col-span-2 text-center">Onboarding</div>
                    </div>

                    {(masterFields[activeCategory] || []).map((f: any) => {
                      const toggle = fieldToggles.find(t => t.key === f.key) || { admission: false, is_required: false, onboarding: false };
                      return (
                        <motion.div 
                          key={f.key} 
                          whileHover={{ x: 4 }}
                          className="grid grid-cols-12 gap-2 items-center py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all rounded px-2 -mx-2"
                        >
                          <div className="col-span-5">
                            <p className="text-sm font-semibold text-foreground">{f.label || f.key}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{f.key}</p>
                          </div>
                          <div className="col-span-2 text-center">
                            <CgBadge variant="neutral" className="text-[10px] uppercase">{f.type}</CgBadge>
                          </div>
                          <div className="col-span-1.5 flex justify-center">
                            <label className="cg-switch scale-75">
                              <input 
                                type="checkbox" 
                                checked={toggle.admission} 
                                onChange={(e) => updateToggle(f.key, 'admission', e.target.checked)} 
                              />
                              <span className="cg-switch__slider"></span>
                            </label>
                          </div>
                          <div className="col-span-1.5 flex justify-center">
                            <label className={`cg-switch scale-75 ${!toggle.admission ? 'opacity-20 pointer-events-none' : ''}`}>
                              <input 
                                type="checkbox" 
                                checked={toggle.is_required}
                                disabled={!toggle.admission}
                                onChange={(e) => updateToggle(f.key, 'is_required', e.target.checked)} 
                              />
                              <span className="cg-switch__slider"></span>
                            </label>
                          </div>
                          <div className="col-span-2 flex justify-center">
                             <label className="cg-switch scale-75">
                              <input 
                                type="checkbox" 
                                checked={toggle.onboarding}
                                onChange={(e) => updateToggle(f.key, 'onboarding', e.target.checked)} 
                              />
                              <span className="cg-switch__slider"></span>
                            </label>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CgSectionPanel>
              </div>
            </div>
          </CgTabContent>

          <CgTabContent value="documents" className="mt-6">
            <CgSectionPanel title="Document Verification Pool" description="Choose which documents candidates must upload during the application process.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(masterDocs || []).map((doc: any) => {
                  const toggle = docToggles.find(t => t.key === doc.key) || { admission: false, onboarding: false };
                  return (
                    <motion.div 
                      key={doc.key} 
                      whileHover={{ scale: 1.01 }}
                      className="p-4 border border-border bg-card rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{doc.label}</p>
                          <p className="text-xs text-muted-foreground">{doc.key}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Admission</p>
                          <label className="cg-switch scale-75">
                            <input 
                              type="checkbox" 
                              checked={toggle.admission} 
                              onChange={(e) => updateDocToggle(doc.key, 'admission', e.target.checked)} 
                            />
                            <span className="cg-switch__slider"></span>
                          </label>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Onboard</p>
                          <label className="cg-switch scale-75">
                            <input 
                              type="checkbox" 
                              checked={toggle.onboarding} 
                              onChange={(e) => updateDocToggle(doc.key, 'onboarding', e.target.checked)} 
                            />
                            <span className="cg-switch__slider"></span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CgSectionPanel>
          </CgTabContent>

          <CgTabContent value="custom" className="mt-6">
            <CgSectionPanel 
              title="Custom Admission Questions" 
              description="Add unique fields that aren't part of the standard pool. These will appear in the 'Additional Info' section."
            >
              <div className="flex justify-between items-center mb-6">
                <CgBadge variant="info">Institutional Fields: {customFields.length}</CgBadge>
                <CgButton variant="primary" size="sm" onClick={addCustomField} className="gap-2">
                  <Plus className="w-4 h-4" /> Create Field
                </CgButton>
              </div>

              {customFields.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                  <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground">No Custom Fields</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
                    Only add custom fields for data that isn't captured in the standard sections. Standard fields ensure better reporting.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customFields.map((cf, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 border border-border bg-card rounded-2xl relative shadow-lg group hover:border-primary/30 transition-all"
                    >
                      <button 
                        onClick={() => removeCustomField(idx)}
                        className="absolute right-4 top-4 p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <Type className="w-3 h-3" /> Question Label
                          </label>
                          <input
                            type="text"
                            value={cf.field_label}
                            onChange={(e) => {
                              const newCf = [...customFields];
                              newCf[idx].field_label = e.target.value;
                              setCustomFields(newCf);
                            }}
                            className="cg-input w-full"
                            placeholder="e.g. Hosteller status?"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <List className="w-3 h-3" /> Input Type
                          </label>
                          <CgSelect
                            value={cf.field_type}
                            onValueChange={(val) => {
                              const newCf = [...customFields];
                              newCf[idx].field_type = val;
                              setCustomFields(newCf);
                            }}
                            options={[
                              { label: "Short Text", value: "text" },
                              { label: "Long Paragraph", value: "textarea" },
                              { label: "Dropdown Select", value: "select" },
                              { label: "Yes/No Toggle", value: "checkbox" }
                            ]}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {cf.field_type === "select" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-6 space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Options (comma separated)</label>
                          <input
                            type="text"
                            value={cf.options?.join(", ") || ""}
                            onChange={(e) => {
                              const newCf = [...customFields];
                              newCf[idx].options = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                              setCustomFields(newCf);
                            }}
                            className="cg-input w-full"
                            placeholder="e.g. Option A, Option B"
                          />
                        </motion.div>
                      )}

                      <div className="flex items-center gap-8 pt-4 border-t border-border/50">
                        <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                          <label className="cg-switch scale-75">
                            <input 
                              type="checkbox" 
                              checked={cf.is_required}
                              onChange={(e) => {
                                const newCf = [...customFields];
                                newCf[idx].is_required = e.target.checked;
                                setCustomFields(newCf);
                              }}
                            />
                            <span className="cg-switch__slider"></span>
                          </label>
                          Required
                        </label>
                        <label className="flex items-center gap-3 text-sm font-medium cursor-pointer text-blue-500">
                           <label className="cg-switch scale-75">
                            <input 
                              type="checkbox" 
                              checked={cf.admission}
                              onChange={(e) => {
                                const newCf = [...customFields];
                                newCf[idx].admission = e.target.checked;
                                setCustomFields(newCf);
                              }}
                            />
                            <span className="cg-switch__slider"></span>
                          </label>
                          Admission Form
                        </label>
                        <label className="flex items-center gap-3 text-sm font-medium cursor-pointer text-emerald-500">
                           <label className="cg-switch scale-75">
                            <input 
                              type="checkbox" 
                              checked={cf.onboarding}
                              onChange={(e) => {
                                const newCf = [...customFields];
                                newCf[idx].onboarding = e.target.checked;
                                setCustomFields(newCf);
                              }}
                            />
                            <span className="cg-switch__slider"></span>
                          </label>
                          Onboarding Form
                        </label>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CgSectionPanel>
          </CgTabContent>

          <CgTabContent value="settings" className="mt-6">
            <CgSectionPanel title="Form Logic & Global Rules" description="Configure global behavior for the admission portal.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="p-6 border border-border rounded-2xl bg-muted/10">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-primary" /> Application Validation</h4>
                    <p className="text-xs text-muted-foreground mb-4">Control how the system validates incoming data before submission.</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-reject empty documents</span>
                        <label className="cg-switch"><input type="checkbox" defaultChecked /><span className="cg-switch__slider"></span></label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Strict phone verification (OTP)</span>
                        <label className="cg-switch"><input type="checkbox" defaultChecked /><span className="cg-switch__slider"></span></label>
                      </div>
                    </div>
                 </div>
                 <div className="p-6 border border-border rounded-2xl bg-muted/10">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Deadline Enforcement</h4>
                    <p className="text-xs text-muted-foreground mb-4">Hard limits for application submission.</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Close form after cutoff date</span>
                        <label className="cg-switch"><input type="checkbox" defaultChecked /><span className="cg-switch__slider"></span></label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Allow edit after submission</span>
                        <label className="cg-switch"><input type="checkbox" /><span className="cg-switch__slider"></span></label>
                      </div>
                    </div>
                 </div>
              </div>
            </CgSectionPanel>
          </CgTabContent>
        </CgTabs>

      </motion.div>
    </CgPageShell>
  );
}
