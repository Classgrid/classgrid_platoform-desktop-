/**
 * components/ui/CmsErrorBoundary.tsx
 * ─────────────────────────────────────────────────────────────
 * IN-CODE BACKUP SAFETY NET
 *
 * Use this instead of notFound() when Sanity returns null.
 * Shows a graceful "content unavailable" page with a retry
 * button — users NEVER see a raw 404 black/white screen.
 *
 * Usage (server component):
 *   import { CmsFallback } from "@/components/ui/CmsErrorBoundary";
 *
 *   if (!post) return <CmsFallback type="blog post" backHref="/blog" />;
 *
 * ─────────────────────────────────────────────────────────────
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, Wifi } from 'lucide-react';
import { SectionAccentBar } from "@/components/ui/section-accent-bar";

type CmsFallbackProps = {
  /** Human-readable name of what failed, e.g. "blog post", "article" */
  type?: string;
  /** Where the back button links to */
  backHref?: string;
  /** Custom back button label */
  backLabel?: string;
};

export function CmsFallback({
  type = 'page',
  backHref = '/',
  backLabel,
}: CmsFallbackProps) {
  const router = useRouter();

  return (
    <main className="min-h-[60vh] bg-background text-foreground flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
          <Wifi className="h-7 w-7 text-muted-foreground" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <SectionAccentBar />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Content temporarily unavailable
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We couldn&apos;t load this {type} right now. This is usually a
            temporary network issue — try refreshing the page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => router.refresh()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href={backHref}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-500"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel ?? `Back to ${type === 'page' ? 'Home' : type + 's'}`}
          </Link>
        </div>

        {/* Tip */}
        <p className="text-xs text-muted-foreground/60 pt-2">
          If this keeps happening, please contact support.
        </p>
      </div>
    </main>
  );
}
