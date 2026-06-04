import React from "react";

export type UniversalCardType = 
  | "assignment" 
  | "quiz" 
  | "notice" 
  | "submission" 
  | "file" 
  | "attendance" 
  | "default";

export type UniversalCardStatus = 
  | "missing" 
  | "late" 
  | "submitted" 
  | "graded" 
  | "published" 
  | "active" 
  | "ended" 
  | "urgent" 
  | "standard";

export interface UniversalCardAction {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "outline" | "ghost" | "danger";
  icon?: React.ReactNode;
}

export interface UniversalCardProp {
  id: string;
  type: UniversalCardType;
  title: string;
  subtitle?: string;
  timestamp?: string | Date;
  author?: {
    name: string;
    avatar?: string;
  };
  status?: UniversalCardStatus;
  metrics?: {
    label: string;
    value: string | number;
  }[];
  onClick?: () => void;
  actions?: UniversalCardAction[];
}
