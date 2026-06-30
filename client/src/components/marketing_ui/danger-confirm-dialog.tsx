"use client";

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
            buttonClass: "bg-red-500 text-white hover:bg-red-600",
        },
        warning: {
            bannerBg: "bg-amber-500/10 dark:bg-amber-500/10",
            bannerBorder: "border-amber-500/20 dark:border-amber-500/20",
            bannerText: "text-amber-700 dark:text-amber-400",
            bannerIcon: "text-amber-600 dark:text-amber-500",
            buttonClass: "bg-amber-500 text-white hover:bg-amber-600",
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
                className={cn(
                    "max-w-[calc(100%-2rem)] p-0 gap-0 border border-white/10 shadow-2xl rounded-xl overflow-hidden bg-[#0f0f0f] flex flex-col max-h-[90dvh]", 
                    maxWidth
                )}
                showCloseButton={false}
                onKeyDown={handleKeyDown}
            >
                {/* ── Section 1: Header ───────────────────────────── */}
                <div className="px-6 py-6 border-b border-white/10 bg-black shrink-0">
                    <DialogTitle className="text-xl font-semibold text-white tracking-tight">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-[15px] text-zinc-400 leading-relaxed mt-3">
                            {description}
                        </DialogDescription>
                    )}
                </div>

                {/* ── Scrollable Body ──────────────────────────────── */}
                <div className="flex-1 overflow-y-auto min-h-0">
                {/* ── Section 2: Confirmation Steps ─────────────────── */}
                {confirmationSteps.length > 0 && (
                    <div className="flex flex-col gap-5 px-6 py-6 border-b border-white/10 bg-[#0f0f0f]">
                        {confirmationSteps.map((step, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-2.5"
                            >
                                <label className="text-sm text-zinc-300">
                                    {step.label}{" "}
                                    <span className="font-bold text-white">
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
                                        "h-10 w-full rounded-md border bg-black px-3 text-sm text-white outline-none transition-all duration-200",
                                        "focus:ring-1 focus:ring-white/30 focus:border-white/30",
                                        "border-white/10"
                                    )}
                                    disabled={isLoading}
                                    autoFocus={index === 0}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Custom Children Content ──────────────────────── */}
                {children && <div className="px-6 py-4 bg-[#0f0f0f]">{children}</div>}
                </div>

                {/* ── Section 3: Footer (Warning + Buttons) ─────────── */}
                <div className="px-6 py-5 flex flex-col gap-5 bg-black border-t border-white/10 shrink-0">
                    {/* Warning Banner */}
                    <div className={cn(
                        "flex items-center gap-3 rounded-md border px-4 py-3",
                        styles.bannerBg,
                        styles.bannerBorder
                    )}>
                        <AlertTriangle className={cn("w-[18px] h-[18px] shrink-0", styles.bannerIcon)} />
                        <span className={cn("text-sm", styles.bannerText)}>
                            {warningMessage}
                        </span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between w-full mt-1">
                        <button
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="h-10 px-4 rounded-md border border-white/10 bg-transparent text-sm font-medium text-white hover:bg-white/5 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!allStepsComplete || isLoading}
                            className={cn(
                                "inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 transition-all duration-200",
                                allStepsComplete
                                    ? styles.buttonClass
                                    : "bg-white/5 text-white/40 cursor-not-allowed"
                            )}
                        >
                            {isLoading && <Spinner className="mr-2" />}
                            {actionLabel}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
