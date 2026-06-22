"use client";

import React from "react";
import * as LucideIcons from "lucide-react";

export function IconRenderer({ name, className }: { name: string, className?: string }) {
  const IconComponent = (LucideIcons as any)[name];
  
  if (!IconComponent) {
    return <LucideIcons.HelpCircle className={className} />;
  }

  return <IconComponent className={className} />;
}
