"use client";

import { Globe, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SUPPORTED_LANGS, LANG_LABELS, type SupportedLang } from "@/lib/locale";

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const getLang = useCallback((): SupportedLang => {
    const param = searchParams.get("lang");
    return (SUPPORTED_LANGS as readonly string[]).includes(param ?? "")
      ? (param as SupportedLang)
      : "en";
  }, [searchParams]);

  const [language, setLanguage] = useState<SupportedLang>(getLang);

  useEffect(() => {
    setLanguage(getLang());
  }, [getLang]);

  const handleLanguageChange = (newLang: string) => {
    // Placeholder mode: Selecting a language does absolutely nothing.
    // Navigation and translation logic is turned off for now.
  };

  return (
    <div className="flex items-center">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label="Select Language"
          className="group flex items-center justify-center h-[32px] gap-1.5 rounded-full border-0 bg-black/[0.06] pl-3 pr-2.5 py-1 text-[12px] font-medium text-foreground dark:bg-white/[0.08] hover:bg-black/[0.12] dark:hover:bg-white/[0.16] focus:ring-0 focus:outline-none focus:ring-offset-0 transition-all duration-300 ease-out"
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Globe
              size={13}
              className="shrink-0 text-muted-foreground transition-all duration-300 ease-out group-hover:text-foreground group-hover:scale-110 group-hover:rotate-12"
            />
            <span className="truncate text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
              {LANG_LABELS[language]}
            </span>
          </div>
          <ChevronDown size={14} className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-xl border-border bg-card text-card-foreground min-w-[110px] max-h-[300px] shadow-lg animate-in fade-in-0 zoom-in-95 duration-200" align="end" sideOffset={8}>
          {SUPPORTED_LANGS.map((code) => (
            <DropdownMenuItem
              key={code}
              onSelect={() => handleLanguageChange(code)}
              className="text-[12px] cursor-pointer transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {LANG_LABELS[code]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
