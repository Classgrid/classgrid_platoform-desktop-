import type { ReactNode } from "react";

type LoginPageShellProps = {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
};

/**
 * The premium dark split-screen container for all login variants.
 * Full-page #0f0f0f background with soft green/orange glow effects,
 * a large rounded #111111 card containing left + right panels.
 *
 * Design by Nikhil Shinde.
 */
export function LoginPageShell({ leftPanel, rightPanel }: LoginPageShellProps) {
  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* ── Background Glow Effects (Opposite Sides) ── */}
      
      {/* Top-Left Emerald Glow (Copied from CommunityClient.tsx) */}
      <div 
        className="pointer-events-none absolute top-0 left-0 -z-10 -translate-x-1/3 -translate-y-1/4 transform-gpu blur-[100px]" 
        aria-hidden="true"
      >
        <div 
          className="aspect-[1097/845] w-[55rem] bg-emerald-500 opacity-20" 
          style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} 
        />
      </div>
      {/* Bottom-Right Orange Glow (Copied from CommunityClient.tsx) */}
      <div 
        className="pointer-events-none absolute bottom-0 right-0 -z-10 translate-x-1/3 translate-y-1/4 transform-gpu blur-[100px]" 
        aria-hidden="true"
      >
        <div 
          className="aspect-[1097/845] w-[55rem] bg-[#ea580c] opacity-[0.15]" 
          style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }} 
        />
      </div>

      {/* ── Main Container (Full Screen) ── */}
      <div className="relative z-10 flex w-full min-h-screen overflow-hidden">
        {/* ── Left Panel (hidden on mobile) ── */}
        <div className="relative hidden w-[45%] md:flex md:flex-col bg-[#0a0a0a]">
          {leftPanel}
        </div>

        {/* ── Divider ── */}
        <div className="hidden w-px bg-white/[0.06] md:block" aria-hidden="true" />

        {/* ── Right Panel ── */}
        <div className="flex w-full flex-col items-center overflow-y-auto px-6 py-8 md:w-[55%] md:px-10 relative bg-[#09090b]">
          <div className="my-auto flex w-full max-w-[440px] flex-col items-center rounded-[24px] border border-white/[0.06] bg-[#141416] p-8 shadow-xl">
            {rightPanel}
          </div>
        </div>
      </div>
    </main>
  );
}
