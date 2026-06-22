"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Global Theme Wrapper Components
 * ================================
 * Use ONLY for theme-specific visual ASSETS (logos, images).
 * DO NOT use for layout or text — those should use semantic tokens
 * (bg-background, text-foreground, etc.) which auto-switch.
 *
 * Usage:
 *   <LightOnly><img src="/logo-dark.svg" /></LightOnly>
 *   <DarkOnly><img src="/logo-light.svg" /></DarkOnly>
 */

function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Renders children ONLY in Light Mode.
 * Hidden in Dark Mode. Prevents hydration mismatch.
 */
export function LightOnly({ children }: { children: ReactNode }) {
  const mounted = useIsMounted();
  const { resolvedTheme } = useTheme();

  if (!mounted) return null;
  if (resolvedTheme === "dark") return null;

  return <>{children}</>;
}

/**
 * Renders children ONLY in Dark Mode.
 * Hidden in Light Mode. Prevents hydration mismatch.
 */
export function DarkOnly({ children }: { children: ReactNode }) {
  const mounted = useIsMounted();
  const { resolvedTheme } = useTheme();

  if (!mounted) return null;
  if (resolvedTheme !== "dark") return null;

  return <>{children}</>;
}
