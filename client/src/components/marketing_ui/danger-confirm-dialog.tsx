import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ConfirmationStep {
    /** Label shown above the input, e.g. 'To confirm, type' */
    label: string;
    /** The exact value the user must type to pass this step */
    value: string;
}

export interface DangerConfirmDialogProps {
    /** Controls dialog open/close state */
    open: boolean;
    /** Called when the dialog wants to close (cancel, X, escape) */
    onOpenChange: (open: boolean) => void;

    /** Dialog title — displayed large at the top */
    title: string;
    /** Description text below the title */
    description?: string | React.ReactNode;

    /**
     * Array of confirmation steps. Each step shows a label and requires
     * the user to type a specific value. Steps are revealed sequentially —
     * step N+1 only appears after step N is correctly filled.
     *
     * Example:
     * ```
     * [
     *   { label: 'To confirm, type', value: 'bill' },
     *   { label: 'To confirm, type', value: 'delete my domain' }
     * ]
     * ```
     */
    confirmationSteps?: ConfirmationStep[];

    /** Warning message shown in the red banner at the bottom */
    warningMessage: string | React.ReactNode;

    /** Text for the action button. Default: "Confirm" */
    actionLabel?: string;
    /** Whether the action is currently loading */
    isLoading?: boolean;
    /** Called when all confirmations pass and user clicks the action button */
    onConfirm: () => void;
    /** Text for the cancel button. Default: "Cancel" */
    cancelLabel?: string;

    /** 
     * Variant controls the warning banner and action button color theme.
     * - "danger" (default): Red warning banner, red action button
     * - "warning": Amber warning banner, amber action button
     */
    variant?: "danger" | "warning";

    /** Max width class override. Default: "sm:max-w-md" */
    maxWidth?: string;

    /** Additional content to render between description and confirmation steps */
    children?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function DangerConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmationSteps = [],
    warningMessage,
    actionLabel = "Confirm",
    isLoading = false,
    onConfirm,
    cancelLabel = "Cancel",
    variant = "danger",
    maxWidth = "sm:max-w-md",
    children,
}: DangerConfirmDialogProps) {
    const [stepValues, setStepValues] = useState<string[]>([]);

    // Reset all inputs when dialog opens/closes
    useEffect(() => {
        if (open) {
            setStepValues(confirmationSteps.map(() => ""));
        }
    }, [open, confirmationSteps.length]);

    const handleStepChange = useCallback((index: number, value: string) => {
        setStepValues(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    // Check if a step is completed (value matches exactly)
    const isStepComplete = (index: number) => {
        return stepValues[index]?.trim() === confirmationSteps[index]?.value;
    };

    // Check if all steps are completed
    const allStepsComplete = confirmationSteps.length === 0 || 
        confirmationSteps.every((_, i) => isStepComplete(i));

    // A step is visible if it's the first step, or the previous step is complete
    const isStepVisible = (index: number) => {
        if (index === 0) return true;
        return isStepComplete(index - 1);
    };

    // Variant-based styles
    const variantStyles = {
        danger: {
            bannerBg: "bg-red-500/10 dark:bg-red-500/10",
            bannerBorder: "border-red-500/20 dark:border-red-500/20",
            bannerText: "text-red-600 dark:text-red-400",
            bannerIcon: "text-red-500 dark:text-red-400",
            buttonVariant: "destructive" as const,
        },
        warning: {
            bannerBg: "bg-amber-500/10 dark:bg-amber-500/10",
            bannerBorder: "border-amber-500/20 dark:border-amber-500/20",
            bannerText: "text-amber-700 dark:text-amber-400",
            bannerIcon: "text-amber-600 dark:text-amber-500",
            buttonVariant: "warning" as const,
        },
    };

    const styles = variantStyles[variant];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && allStepsComplete && !isLoading) {
            e.preventDefault();
            onConfirm();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className={cn("max-w-[calc(100%-2rem)]", maxWidth)}
                onKeyDown={handleKeyDown}
            >
                {/* ── Header ───────────────────────────────────────── */}
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-foreground tracking-tight">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm text-muted-foreground leading-relaxed mt-1">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* ── Custom Children Content ──────────────────────── */}
                {children}

                {/* ── Confirmation Steps ───────────────────────────── */}
                {confirmationSteps.length > 0 && (
                    <div className="flex flex-col gap-4 mt-1">
                        {confirmationSteps.map((step, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex flex-col gap-2 transition-all duration-300",
                                    isStepVisible(index) 
                                        ? "opacity-100 translate-y-0" 
                                        : "opacity-0 h-0 overflow-hidden pointer-events-none -translate-y-2"
                                )}
                            >
                                <label className="text-sm text-muted-foreground">
                                    {step.label}{" "}
                                    <span className="font-bold text-foreground">
                                        &ldquo;{step.value}&rdquo;
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={stepValues[index] || ""}
                                    onChange={(e) => handleStepChange(index, e.target.value)}
                                    placeholder=""
                                    autoComplete="off"
                                    spellCheck={false}
                                    className={cn(
                                        "h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-all duration-200",
                                        "placeholder:text-muted-foreground/40",
                                        "focus:ring-2 focus:ring-ring/50 focus:border-ring",
                                        isStepComplete(index)
                                            ? "border-emerald-500/50 bg-emerald-500/5"
                                            : "border-border"
                                    )}
                                    disabled={isLoading}
                                    autoFocus={index === 0}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Warning Banner ───────────────────────────────── */}
                <div className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 mt-1",
                    styles.bannerBg,
                    styles.bannerBorder
                )}>
                    <AlertTriangle className={cn("w-4 h-4 shrink-0", styles.bannerIcon)} />
                    <span className={cn("text-sm font-medium", styles.bannerText)}>
                        {warningMessage}
                    </span>
                </div>

                {/* ── Footer ──────────────────────────────────────── */}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={styles.buttonVariant}
                        onClick={onConfirm}
                        disabled={!allStepsComplete || isLoading}
                        className={cn(
                            "transition-all duration-200",
                            !allStepsComplete && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading && <Spinner className="mr-2" size="sm" />}
                        {actionLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
