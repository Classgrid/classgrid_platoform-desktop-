import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "./theme-provider";
import { useTheme } from "next-themes";
import { useEffect } from "react";

function ThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "theme-sync" && (event.data?.theme === "light" || event.data?.theme === "dark" || event.data?.theme === "system")) {
        setTheme(event.data.theme);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setTheme]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeSync />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
