import React from "react";
import { Book, Brain, Bell, FileText, UploadCloud, CalendarCheck, HelpCircle } from "lucide-react";
import { UniversalCardType, UniversalCardStatus } from "./types";

export const getCardTypeConfig = (type: UniversalCardType) => {
  switch (type) {
    case "assignment":
      return { icon: Book, bgClass: "bg-purple-500/10", textClass: "text-purple-600 dark:text-purple-400" };
    case "quiz":
      return { icon: Brain, bgClass: "bg-blue-500/10", textClass: "text-blue-600 dark:text-blue-400" };
    case "notice":
      return { icon: Bell, bgClass: "bg-amber-500/10", textClass: "text-amber-600 dark:text-amber-400" };
    case "submission":
      return { icon: UploadCloud, bgClass: "bg-emerald-500/10", textClass: "text-emerald-600 dark:text-emerald-400" };
    case "file":
      return { icon: FileText, bgClass: "bg-rose-500/10", textClass: "text-rose-600 dark:text-rose-400" };
    case "attendance":
      return { icon: CalendarCheck, bgClass: "bg-indigo-500/10", textClass: "text-indigo-600 dark:text-indigo-400" };
    default:
      return { icon: HelpCircle, bgClass: "bg-muted", textClass: "text-muted-foreground" };
  }
};

export const getStatusBadgeConfig = (status: UniversalCardStatus) => {
  switch (status) {
    case "missing":
    case "urgent":
      return "bg-danger/10 text-danger border border-danger/20";
    case "late":
    case "ended":
      return "bg-warning/10 text-warning border border-warning/20";
    case "submitted":
    case "graded":
    case "active":
      return "bg-success/10 text-success border border-success/20";
    case "published":
    case "standard":
    default:
      return "bg-primary/10 text-primary border border-primary/20";
  }
};

export const formatRelativeTime = (dateInput?: string | Date) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffInHours < 48) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
