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
      {/* ── Background Glow Effects ── */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full opacity-15 blur-[120px]"
        style={{ background: "radial-gradient(circle, #ea580c 0%, transparent 70%)" }}
        aria-hidden="true"
      />

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
