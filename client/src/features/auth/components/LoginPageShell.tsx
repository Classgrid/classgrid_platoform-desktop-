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
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0f0f0f]">
      {/* ── Background Glow Effects ── */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full opacity-15 blur-[120px]"
        style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* ── Main Container ── */}
      <div className="relative z-10 flex w-[94%] max-w-[1350px] overflow-hidden rounded-3xl border border-white/[0.14] bg-[#111111]" style={{ height: "90vh" }}>
        {/* ── Left Panel (hidden on mobile) ── */}
        <div className="relative hidden w-1/2 md:flex md:flex-col">
          {leftPanel}
        </div>

        {/* ── Divider ── */}
        <div className="hidden w-px bg-white/[0.14] md:block" aria-hidden="true" />

        {/* ── Right Panel ── */}
        <div className="flex w-full flex-col items-center justify-center overflow-y-auto px-6 py-8 md:w-1/2 md:px-10 lg:px-14">
          {rightPanel}
        </div>
      </div>
    </main>
  );
}
