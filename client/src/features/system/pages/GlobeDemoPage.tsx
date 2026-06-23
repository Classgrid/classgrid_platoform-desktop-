import { Globe } from "@/components/marketing_ui/Globe.jsx";

export function GlobeDemoPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-5 px-6 py-10">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-normal sm:text-4xl">Globe Demo</h1>
          <p className="mt-2 text-sm text-slate-400">Drag the globe to rotate it. This route is only for preview.</p>
        </div>
        <div className="relative grid aspect-square w-full max-w-[760px] place-items-center overflow-visible">
          <Globe />
        </div>
      </section>
    </main>
  );
}
