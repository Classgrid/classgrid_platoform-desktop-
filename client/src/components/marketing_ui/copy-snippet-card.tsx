import React, { useState } from "react";
import { Copy, Check, ExternalLink, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopySnippetCardProps {
  title: string;
  description?: React.ReactNode;
  value: string;
  footerText?: string;
  footerLink?: string;
  className?: string;
}

export function CopySnippetCard({
  title,
  description,
  value,
  footerText,
  footerLink,
  className,
}: CopySnippetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("bg-card border border-border rounded-xl shadow-sm flex flex-col", className)}>
      {/* Main Content Area */}
      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {title}
            <LinkIcon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* Code Snippet Box */}
        <div className="relative flex items-center mt-2">
          <div className="w-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg py-2.5 pl-3 pr-12 font-mono text-sm text-foreground overflow-x-auto whitespace-nowrap">
            {value}
          </div>
          <button
            onClick={handleCopy}
            className="absolute right-2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Footer Area */}
      {(footerText || footerLink) && (
        <div className="border-t border-border/50 px-5 py-3 bg-muted/10 rounded-b-xl flex items-center">
          <a
            href={footerLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
          >
            {footerText}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
