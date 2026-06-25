import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Save, DollarSign, Sparkles,
  BarChart2, PieChart as PieIcon, TrendingUp,
  Activity, CheckCircle, AlertTriangle, Clock, Users
} from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import {
  getAdmissionConfigFull,
  updateAdmissionConfig,
} from "../../admissions/api";

/* ── animations ── */
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/* ── API helpers ── */
async function getFeeStructures() {
  const r = await apiClient.get("/api/fees/structures");
  return r.data;
}
async function getFeeAnalytics() {
  const r = await apiClient.get("/api/fees/analytics");
  return r.data;
}
async function getFeePayments() {
  const r = await apiClient.get("/api/fees/payments");
  return r.data;
}
async function createFeeStructure(payload: any) {
  const r = await apiClient.post("/api/fees/structures", payload);
  return r.data;
}
async function deleteFeeStructure(id: string) {
  const r = await apiClient.delete(`/api/fees/structures/${id}`);
  return r.data;
}

/* ── helpers ── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const PAYMENT_METHODS = ["cash", "online", "upi", "cheque", "neft"];

export function FeeStructurePage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newStruct, setNewStruct] = useState({
    name: "",
    academic_year: "",
    total_amount: 0,
    due_date: "",
    late_fine_per_day: 0,
    payment_mode: "manual",
    components: [] as { name: string; amount: number }[],
  });

  /* ── queries ── */
  const structures = useQuery({ queryKey: ["fee-structures"], queryFn: getFeeStructures });
  const analytics = useQuery({ queryKey: ["fee-analytics"], queryFn: getFeeAnalytics });
  const payments = useQuery({ queryKey: ["fee-payments"], queryFn: getFeePayments });
  const admConfig = useQuery({ queryKey: ["admission-config-full"], queryFn: getAdmissionConfigFull });

  /* ── mutations ── */
  const createMut = useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-structures"] }); setShowCreate(false); },
  });
  const deleteMut = useMutation({
    mutationFn: deleteFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-structures"] }),
  });
  const saveAdmConfig = useMutation({
    mutationFn: (cfg: any) => updateAdmissionConfig({ admission_config: cfg }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admission-config-full"] }),
  });

  /* ── derived data ── */
  const anal = analytics.data;
  const structs: any[] = structures.data?.structures || [];
  const pays: any[] = payments.data?.payments || [];
  const admCfg = admConfig.data?.config;

  /* ── chart data ── */
  const statusPie = anal ? [
    { name: "Paid", value: anal.paidCount ?? 0, color: "#34d399" },
    { name: "Partial", value: anal.partialCount ?? 0, color: "#f59e0b" },
    { name: "Unpaid", value: anal.unpaidCount ?? 0, color: "#f87171" },
    { name: "Overdue", value: anal.overdueCount ?? 0, color: "#818cf8" },
  ] : [];

  const collectionDonut = anal ? [
    { name: "Collected", value: anal.totalCollection ?? 0, color: "#34d399" },
    { name: "Pending", value: anal.totalPending ?? 0, color: "#f87171" },
  ] : [];

  /* payment method breakdown from pays */
  const methodMap: Record<string, number> = {};
  pays.forEach((p) => { methodMap[p.payment_method] = (methodMap[p.payment_method] || 0) + Number(p.amount); });
  const methodBar = Object.entries(methodMap).map(([method, total]) => ({ method, total }));

  /* amount histogram from structs */
  const amountBuckets: Record<string, number> = {
    "<50k": 0, "50-100k": 0, "100-200k": 0, "200-500k": 0, ">500k": 0,
  };
  structs.forEach((s) => {
    const a = Number(s.total_amount);
    if (a < 50000) amountBuckets["<50k"] = (amountBuckets["<50k"] ?? 0) + 1;
    else if (a < 100000) amountBuckets["50-100k"] = (amountBuckets["50-100k"] ?? 0) + 1;
    else if (a < 200000) amountBuckets["100-200k"] = (amountBuckets["100-200k"] ?? 0) + 1;
    else if (a < 500000) amountBuckets["200-500k"] = (amountBuckets["200-500k"] ?? 0) + 1;
    else amountBuckets[">500k"] = (amountBuckets[">500k"] ?? 0) + 1;
  });
  const histData = Object.entries(amountBuckets).map(([bin, count]) => ({ bin, count }));

  /* recent payments trend (last 14 days) */
  const trendMap: Record<string, number> = {};
  pays.slice(0, 100).forEach((p) => {
    const d = p.payment_date?.split("T")[0] || "";
    if (d) trendMap[d] = (trendMap[d] || 0) + Number(p.amount);
  });
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, amount]) => ({ day: day.slice(5), amount }));

  /* structure bar */
  const structBar = structs.slice(0, 8).map((s) => ({
    name: s.name?.substring(0, 18) || "—",
    amount: Number(s.total_amount),
  }));

  /* ── table columns ── */
  const structCols = [
    { key: "name", header: "Structure Name" },
    { key: "academic_year", header: "Year" },
    {
      key: "total_amount",
      header: "Amount",
      render: (r: any) => <span className="font-mono font-semibold text-primary">{fmt(r.total_amount)}</span>,
    },
    {
      key: "payment_mode",
      header: "Mode",
      render: (r: any) => <div variant={r.payment_mode === "online" ? "success" : "neutral"}>{r.payment_mode}</div>,
    },
    {
      key: "due_date",
      header: "Due",
      render: (r: any) => <span className="text-sm text-muted-foreground">{r.due_date || "—"}</span>,
    },
    {
      key: "_id",
      header: "Action",
      render: (r: any) => (
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => deleteMut.mutate(r.id)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2--sm text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      ),
    },
  ];

  const paymentCols = [
    { key: "payment_date", header: "Date", render: (r: any) => <span className="text-sm">{r.payment_date}</span> },
    { key: "amount", header: "Amount", render: (r: any) => <span className="font-mono font-semibold text-primary">{fmt(r.amount)}</span> },
    { key: "payment_method", header: "Method", render: (r: any) => <div variant="neutral">{r.payment_method}</div> },
    { key: "reference_number", header: "Ref", render: (r: any) => <span className="text-xs text-muted-foreground">{r.reference_number || "—"}</span> },
  ];

  return (
    <div
      title="Fee Structure"
      description="Manage fee structures, collection analytics, and payment records"
      breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Fee Structure" }]}
      actions={
        <motion.button
          whileHover={{ scale: 1.03 }}
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Structure
        </motion.button>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="">

        {/* ── KPI Row ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            title="Total Collected"
            value={fmt(anal?.totalCollection ?? 0)}
            icon={<DollarSign className="w-4 h-4" />}
            trend={{ value: anal?.collectionRate ?? 0, label: "collection rate" }}
          />
          <div
            title="Total Pending"
            value={fmt(anal?.totalPending ?? 0)}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <div
            title="Fully Paid"
            value={`${anal?.paidCount ?? 0} students`}
            icon={<CheckCircle className="w-4 h-4" />}
            trend={{ value: anal?.collectionRate ?? 0, label: "% paid" }}
          />
          <div
            title="Overdue"
            value={`${anal?.overdueCount ?? 0} students`}
            icon={<Clock className="w-4 h-4" />}
          />
        </motion.div>

        {/* ── Analytics Charts ── */}
        <motion.div variants={fadeUp}>
          <div title="Collection Analytics" description="Real-time visualizations of fee collection pipeline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-primary" /> Payment Status Distribution
                </p>
                <div data={statusPie} height={240} valuePrefix="₹" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-400" /> Collected vs Pending
                </p>
                <div data={collectionDonut} height={240} valuePrefix="₹" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-400" /> Amount by Structure
                </p>
                <div
                  data={structBar}
                  indexKey="name"
                  series={[{ key: "amount", name: "Amount (₹)", color: "#34d399" }]}
                  height={240}
                  valuePrefix="₹"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" /> Payment Trend (14 days)
                </p>
                <div
                  data={trendData.length ? trendData : [{ day: "No data", amount: 0 }]}
                  indexKey="day"
                  series={[{ key: "amount", name: "Amount Collected", color: "#34d399" }]}
                  height={220}
                  valuePrefix="₹"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-400" /> Fee Amount Histogram
                </p>
                <div data={histData} height={220} fill="hsl(var(--primary))" />
              </div>
            </div>

            {methodBar.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" /> Collection by Payment Method
                </p>
                <div
                  data={methodBar}
                  indexKey="method"
                  series={[{ key: "total", name: "Total Collected (₹)", color: "#60a5fa" }]}
                  height={200}
                  valuePrefix="₹"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Main Tabs ── */}
        <motion.div variants={fadeUp}>
          <div defaultValue="structures">
            <div>
              <div value="structures">
                <DollarSign className="w-4 h-4" /> Fee Structures ({structs.length})
              </div>
              <div value="payments">
                <Activity className="w-4 h-4" /> Recent Payments
              </div>
              <div value="admission-link">
                <Users className="w-4 h-4" /> Admission Fee Config
              </div>
            </div>

            {/* Structures Table */}
            <div value="structures">
              <div className="mt-4">
                {structures.isLoading ? (
                  <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-primary" /> Loading structures...
                  </div>
                ) : structs.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-border rounded-lg text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No fee structures yet</p>
                    <p className="text-sm mt-1">Click "New Structure" to create one.</p>
                  </div>
                ) : (
                  <div columns={structCols} data={structs} />
                )}
              </div>
            </div>

            {/* Payments Table */}
            <div value="payments">
              <div className="mt-4">
                {payments.isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading payments...</div>
                ) : pays.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-border rounded-lg text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p>No payment records found.</p>
                  </div>
                ) : (
                  <div columns={paymentCols} data={pays.slice(0, 50)} />
                )}
              </div>
            </div>

            {/* Admission Fee Config link */}
            <div value="admission-link">
              <div className="mt-4">
                <div title="Admission Registration Fee" description="Sync registration fee with admission portal config">
                  <div variant="info" title="Linked Config" className="mb-4">
                    The registration fee below is stored in the Admission Config and charged on application submission.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Registration Fee (₹)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="number"
                          defaultValue={admCfg?.registration_fee ?? 0}
                          id="reg-fee-sync"
                          className=" pl-9 w-full"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Leave 0 for free applications.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Default Fee Structure ID</label>
                      <input
                        type="text"
                        defaultValue={admCfg?.fee_config?.admission_fee_structure_id ?? ""}
                        id="default-struct-id"
                        className=""
                        placeholder="Paste fee_structure UUID"
                      />
                      <p className="text-xs text-muted-foreground">
                        Links admission enrollment to a global fee structure.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      disabled={saveAdmConfig.isPending || !admCfg}
                      onClick={() => {
                        const fee = Number((document.getElementById("reg-fee-sync") as HTMLInputElement)?.value);
                        const structId = (document.getElementById("default-struct-id") as HTMLInputElement)?.value;
                        saveAdmConfig.mutate({
                          ...admCfg,
                          registration_fee: fee,
                          fee_config: {
                            ...(admCfg?.fee_config || {}),
                            admission_fee_structure_id: structId,
                          },
                        });
                      }}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow flex items-center gap-2"
                    >
                      {saveAdmConfig.isPending ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save to Admission Config
                    </motion.button>
                  </div>
                  {saveAdmConfig.isSuccess && (
                    <div variant="success" title="Saved" className="mt-4">
                      Admission fee config updated successfully.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Create Structure Modal ── */}
      <div open={showCreate} onClose={() => setShowCreate(false)} title="Create Fee Structure">
        <div>
          <div className=" gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Structure Name *</label>
                <input
                  className=""
                  placeholder="e.g. Standard Engineering Package"
                  value={newStruct.name}
                  onChange={(e) => setNewStruct({ ...newStruct, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Academic Year</label>
                <input
                  className=""
                  placeholder="e.g. 2025-26"
                  value={newStruct.academic_year}
                  onChange={(e) => setNewStruct({ ...newStruct, academic_year: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Total Amount (₹)</label>
                <input
                  type="number"
                  className=""
                  value={newStruct.total_amount}
                  onChange={(e) => setNewStruct({ ...newStruct, total_amount: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Late Fine per Day (₹)</label>
                <input
                  type="number"
                  className=""
                  value={newStruct.late_fine_per_day}
                  onChange={(e) => setNewStruct({ ...newStruct, late_fine_per_day: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Due Date</label>
                <input
                  type="date"
                  className=""
                  value={newStruct.due_date}
                  onChange={(e) => setNewStruct({ ...newStruct, due_date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Payment Mode</label>
                <select
                  className=""
                  value={newStruct.payment_mode}
                  onChange={(e) => setNewStruct({ ...newStruct, payment_mode: e.target.value })}
                >
                  <option value="manual">Manual</option>
                  <option value="online">Online (Razorpay)</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            {/* Components */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Fee Components</label>
                <button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2--sm flex items-center gap-1"
                  onClick={() => setNewStruct({
                    ...newStruct,
                    components: [...newStruct.components, { name: "", amount: 0 }],
                  })}
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {newStruct.components.map((comp, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className=" flex-1"
                      placeholder="Component name (e.g. Tuition)"
                      value={comp.name}
                      onChange={(e) => {
                        const c = [...newStruct.components];
                        if (c[i]) c[i].name = e.target.value;
                        setNewStruct({ ...newStruct, components: c });
                      }}
                    />
                    <input
                      type="number"
                      className=" w-32"
                      placeholder="Amount"
                      value={comp.amount}
                      onChange={(e) => {
                        const c = [...newStruct.components];
                        if (c[i]) c[i].amount = Number(e.target.value);
                        setNewStruct({ ...newStruct, components: c });
                      }}
                    />
                    <button
                      className="p-2 text-destructive hover:bg-destructive/10 rounded"
                      onClick={() => {
                        const c = newStruct.components.filter((_, idx) => idx !== i);
                        setNewStruct({ ...newStruct, components: c });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => setShowCreate(false)}>Cancel</button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow flex items-center gap-2"
            disabled={createMut.isPending || !newStruct.name}
            onClick={() => createMut.mutate(newStruct)}
          >
            {createMut.isPending ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Structure
          </motion.button>
        </div>
      </div>
    </div>
  );
}
