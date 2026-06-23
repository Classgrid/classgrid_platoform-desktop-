import { useState } from "react";
import { useTheme } from "next-themes";
import { CgSwitch } from "@/components/classgrid/Switch";
import { CgSkeleton } from "@/components/classgrid/Skeleton";
import { Spinner } from "@/components/ui/spinner";

export function SandboxPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen p-8 bg-background text-foreground transition-colors duration-200">
      <div className="mb-12 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Component Sandbox</h1>
        <p className="text-sm text-muted-foreground mt-1">Testing ground for Classgrid components</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* --- CgSwitch --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">CgSwitch</h2>
          </div>
          
          <CgSwitch 
            checked={theme === "dark"} 
            onCheckedChange={(c) => setTheme(c ? "dark" : "light")} 
          />
          
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Theme: <code className="font-mono bg-muted text-foreground px-2 py-1 rounded-md text-xs font-semibold">{theme}</code>
          </div>
        </div>

        {/* --- CgSkeleton --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">CgSkeleton</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Instead of spinning circles, we compose multiple skeletons together to create a "wireframe" of the content that is about to load. This makes the dashboard feel significantly faster.
          </p>

          {/* Simulated Loading Profile Card */}
          <div className="w-full max-w-sm p-6 border border-border rounded-xl bg-background flex items-center gap-4">
            {/* Avatar Skeleton */}
            <CgSkeleton variant="circular" className="h-16 w-16 shrink-0" />
            
            {/* Text Skeletons */}
            <div className="flex-1 space-y-3">
              <CgSkeleton variant="text" className="h-4 w-3/4" />
              <CgSkeleton variant="text" className="h-3 w-1/2" />
            </div>
          </div>
        </div>

        {/* --- Spinner --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Spinner</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            For small inline loading states (like inside a button) or full-page blocks, we use this Vercel-style spinner.
          </p>

          <div className="flex gap-12 items-center">
            {/* Default Size */}
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <span className="text-xs text-muted-foreground">Default (16px)</span>
            </div>
            
            {/* Medium Size with Primary Color */}
            <div className="flex flex-col items-center gap-3">
              <Spinner className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <span className="text-xs text-muted-foreground">Medium & Colored</span>
            </div>

            {/* Inside a Button */}
            <div className="flex flex-col items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium text-sm">
                <Spinner className="w-4 h-4 text-background" />
                Saving...
              </button>
              <span className="text-xs text-muted-foreground">Inside Button</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
