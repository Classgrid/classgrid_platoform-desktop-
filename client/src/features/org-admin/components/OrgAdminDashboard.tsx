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
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Usage & Billing</h1>
                <p className="text-muted-foreground mt-1">Monitor your organization's pay-as-you-go resource consumption.</p>
            </div>

            {/* VERCEL STYLE USAGE CHART */}
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md bg-background hover:bg-muted transition-colors">
                                    <selectedMetric.icon className="h-4 w-4" style={{ color: selectedMetric.color }} />
                                    {selectedMetric.label}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px]">
                                {METRICS.map(m => (
                                    <DropdownMenuItem key={m.key} onClick={() => setSelectedMetric(m)}>
                                        <m.icon className="h-4 w-4 mr-2" style={{ color: m.color }} />
                                        {m.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                        <div>Total this month</div>
                        <div className="font-semibold text-foreground text-lg">
                            {formatNumber(dailySeries.reduce((acc, curr) => acc + (curr[selectedMetric.key as keyof typeof curr] as number), 0))}
                        </div>
                    </div>
                </div>
                <div className="p-6">
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
                
                {/* Vercel style limit bars */}
                <div className="border-t border-border/40">
                    <div className="p-4 px-6 bg-muted/10">
                        <h3 className="text-sm font-medium">Overview</h3>
                    </div>
                    <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto">
                        {usageItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-muted/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full border-2 border-primary/20 flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                                </div>
                                <div className="text-sm text-muted-foreground font-mono">
                                    {formatNumber(item.value)} {item.unit}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* INVOICE SECTION */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border/40 bg-card p-6 flex flex-col justify-center items-center text-center">
                    <Receipt className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-1">Current Month Accrued</h3>
                    <p className="text-muted-foreground text-sm mb-4">Pay-As-You-Go charges generated this month (excl. GST).</p>
                    <div className="text-5xl font-bold tracking-tight">
                        {formatCurrency(currentMonth.totalAmountInr)}
                    </div>
                </div>

                <div className="rounded-xl border border-border/40 bg-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Latest Invoice</h3>
                    {latestInvoice ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-border/40">
                                <div>
                                    <div className="text-sm text-muted-foreground">Invoice Number</div>
                                    <div className="font-medium">{latestInvoice.invoiceNumber}</div>
                                </div>
                                <Badge variant={latestInvoice.status === 'paid' ? 'success' : 'warning'}>
                                    {latestInvoice.status.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-border/40">
                                <div>
                                    <div className="text-sm text-muted-foreground">Total Amount</div>
                                    <div className="font-medium text-lg">{formatCurrency(latestInvoice.totalAmountInr)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground text-right">Due Date</div>
                                    <div className="font-medium">{new Date(latestInvoice.dueDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                            
                            {latestInvoice.status !== 'paid' ? (
                                <button 
                                    onClick={handleRazorpayCheckout}
                                    disabled={isPaying}
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 mt-2 disabled:opacity-50"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    {isPaying ? "Processing..." : "Pay Now via Razorpay"}
                                </button>
                            ) : (
                                <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 mt-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>Fully Paid</AlertTitle>
                                    <AlertDescription>Thank you! Your latest invoice has been paid.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Receipt className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h4 className="text-sm font-medium">No Invoices Yet</h4>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                Your first invoice will be generated on the 1st of next month.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
