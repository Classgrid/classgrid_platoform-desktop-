import React, { useEffect, useState } from "react";
import { 
    Activity, BrainCircuit, HardDrive, Mail, MessageSquare, Video, Receipt, CreditCard, ChevronDown, CheckCircle2 
} from "lucide-react";
import { BarChart } from "@/components/charts/BarChart";
import { organizationControlCenterApi, OrgBillingDashboardResponse } from "../../superadmin/services/organizationControlCenterApi";
import { formatCurrency, formatNumber } from "../../superadmin/components/org-details/formatters";
import { Badge } from "@/components/marketing_ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/marketing_ui/alert";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/marketing_ui/dropdown-menu";
import { toast } from "sonner";

const METRICS = [
    { key: "API Requests", label: "API Requests", icon: Activity, color: "#3b82f6" },
    { key: "AI Tokens", label: "AI Tokens", icon: BrainCircuit, color: "#a855f7" },
    { key: "Storage (GB)", label: "R2 Storage (GB-Days)", icon: HardDrive, color: "#14b8a6" },
    { key: "Emails", label: "SES Emails", icon: Mail, color: "#f59e0b" },
    { key: "SMS", label: "Firebase SMS", icon: MessageSquare, color: "#10b981" },
    { key: "Video Mins", label: "Agora Video Minutes", icon: Video, color: "#f43f5e" },
];

export function OrgAdminDashboard() {
    const [data, setData] = useState<OrgBillingDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState(METRICS[0]);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        // Load Razorpay Script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        organizationControlCenterApi.getOrgBillingDashboard()
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load billing dashboard", err);
                setLoading(false);
            });

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handleRazorpayCheckout = async () => {
        if (!data?.latestInvoice) return;
        setIsPaying(true);

        try {
            const order = await organizationControlCenterApi.createRazorpayOrder(data.latestInvoice.id);

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: "Classgrid Platform",
                description: `Invoice Payment: ${data.latestInvoice.invoiceNumber}`,
                order_id: order.order_id,
                handler: async function (response: any) {
                    try {
                        await organizationControlCenterApi.verifyRazorpayPayment({
                            ...response,
                            invoiceId: data.latestInvoice!.id
                        });
                        toast.success("Payment successful!");
                        
                        // Optimistically update UI
                        setData((prev: any) => ({
                            ...prev,
                            latestInvoice: { ...prev.latestInvoice, status: 'paid' }
                        }));
                    } catch (err: any) {
                        toast.error("Payment verification failed.");
                    }
                },
                theme: { color: "hsl(var(--primary))" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function () {
                toast.error("Payment failed or cancelled.");
            });
            rzp.open();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to initiate payment.");
        } finally {
            setIsPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) return null;

    const { currentMonth, dailySeries, latestInvoice } = data;

    // Calculate totals for limits/progress bars (mocking limits for now as pay-as-you-go is unlimited)
    const usageItems = [
        { label: "API Requests", value: currentMonth.totalApiRequests, unit: "Reqs", limit: null },
        { label: "AI Tokens", value: currentMonth.totalAiTokens, unit: "Tokens", limit: null },
        { label: "R2 Storage", value: currentMonth.totalStorageGbDays, unit: "GB-Days", limit: null },
        { label: "SES Emails", value: currentMonth.totalEmails, unit: "Emails", limit: null },
        { label: "Firebase SMS", value: currentMonth.totalSmsSegments, unit: "Segments", limit: null },
        { label: "Agora Video", value: currentMonth.totalAgoraMinutes, unit: "Mins", limit: null },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 bg-[#000000] text-white min-h-screen p-8">
            <div className="border-b border-[#333] pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-white">Usage & Billing Console</h1>
                <p className="text-gray-400 mt-1 font-mono text-sm">MONITOR_ORG_RESOURCE_CONSUMPTION // PAY_AS_YOU_GO</p>
            </div>

            {/* AGORA STYLE USAGE CHART */}
            <div className="border border-[#333] bg-[#000000] overflow-hidden rounded-none">
                <div className="p-4 border-b border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827]">
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-mono border border-[#333] rounded-none bg-black hover:bg-[#222] transition-colors text-white">
                                    <selectedMetric.icon className="h-4 w-4" style={{ color: selectedMetric.color }} />
                                    {selectedMetric.label}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px] rounded-none border-[#333] bg-black text-white">
                                {METRICS.map(m => (
                                    <DropdownMenuItem key={m.key} onClick={() => setSelectedMetric(m)} className="rounded-none hover:bg-[#333] cursor-pointer">
                                        <m.icon className="h-4 w-4 mr-2" style={{ color: m.color }} />
                                        {m.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="text-sm text-gray-400 text-right font-mono">
                        <div>TOTAL_MTD</div>
                        <div className="font-bold text-white text-lg">
                            {formatNumber(dailySeries.reduce((acc, curr) => acc + (curr[selectedMetric.key as keyof typeof curr] as number), 0))}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-black">
                    <BarChart
                        data={dailySeries}
                        index="date"
                        categories={[selectedMetric.key]}
                        colors={[selectedMetric.color]}
                        valueFormatter={(val) => formatNumber(val)}
                        className="h-[300px]"
                        yAxisWidth={60}
                    />
                </div>
                
                {/* Agora style limit bars */}
                <div className="border-t border-[#333]">
                    <div className="p-3 px-6 bg-[#111827]">
                        <h3 className="text-sm font-mono text-gray-300 font-bold tracking-wider">RESOURCE_METRICS</h3>
                    </div>
                    <div className="divide-y divide-[#333] max-h-[300px] overflow-y-auto bg-black">
                        {usageItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 px-6 hover:bg-[#111] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 border border-[#34d399] flex items-center justify-center bg-black">
                                        <div className="h-1 w-1 bg-[#34d399]" />
                                    </div>
                                    <span className="text-sm font-mono text-gray-300">{item.label}</span>
                                </div>
                                <div className="text-sm text-[#34d399] font-mono">
                                    {formatNumber(item.value)} {item.unit}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* INVOICE SECTION */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="border border-[#333] bg-black p-6 flex flex-col justify-center items-center text-center rounded-none shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                    <Receipt className="h-10 w-10 text-gray-500 mb-4" />
                    <h3 className="text-xl font-mono text-gray-200 mb-1">ACCRUED_UNBILLED</h3>
                    <p className="text-gray-500 text-sm mb-4 font-mono">Current month usage cost (excl. tax)</p>
                    <div className="text-5xl font-bold tracking-tight text-[#34d399] font-mono">
                        {formatCurrency(currentMonth.totalAmountInr)}
                    </div>
                </div>

                <div className="border border-[#333] bg-black p-6 rounded-none">
                    <h3 className="text-lg font-mono text-gray-200 mb-4 border-b border-[#333] pb-2">LATEST_INVOICE</h3>
                    {latestInvoice ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-[#333]">
                                <div>
                                    <div className="text-xs font-mono text-gray-500">ID</div>
                                    <div className="font-mono text-gray-200">{latestInvoice.invoiceNumber}</div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-mono border rounded-none ${latestInvoice.status === 'paid' ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/30' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}`}>
                                    {latestInvoice.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-[#333]">
                                <div>
                                    <div className="text-xs font-mono text-gray-500">TOTAL</div>
                                    <div className="font-mono text-lg text-white">{formatCurrency(latestInvoice.totalAmountInr)}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-mono text-gray-500 text-right">DUE</div>
                                    <div className="font-mono text-gray-200">{new Date(latestInvoice.dueDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                            
                            {latestInvoice.status !== 'paid' ? (
                                <button 
                                    onClick={handleRazorpayCheckout}
                                    disabled={isPaying}
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-none bg-[#34d399] px-4 py-3 text-sm font-mono text-black font-bold hover:bg-[#34d399]/90 mt-2 disabled:opacity-50 transition-colors"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    {isPaying ? "PROCESSING..." : "PAY_NOW_RZP"}
                                </button>
                            ) : (
                                <div className="bg-[#34d399]/10 border border-[#34d399]/30 text-[#34d399] p-3 flex items-start gap-3 mt-2 rounded-none">
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    <div>
                                        <div className="font-mono font-bold text-sm">SETTLED</div>
                                        <div className="font-mono text-xs opacity-80 mt-1">Invoice has been paid in full.</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 border border-[#333] bg-[#111] flex items-center justify-center mb-3 rounded-none">
                                <Receipt className="h-5 w-5 text-gray-600" />
                            </div>
                            <h4 className="text-sm font-mono text-gray-400">NO_RECORDS</h4>
                            <p className="text-xs text-gray-600 mt-2 font-mono">
                                Next generation cycle: 01_NEXT_MONTH
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
