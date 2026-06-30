import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle, RefreshCcw } from "lucide-react";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-foreground">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle className="h-10 w-10 text-danger" />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Something went wrong!</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          A critical error occurred while rendering this page.
        </p>
        
        <div className="mb-8 w-full overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm">
          <div className="border-b border-border bg-muted/50 px-4 py-2 font-mono text-sm font-semibold text-muted-foreground">
            Error Details
          </div>
          <div className="p-4 overflow-auto max-h-[40vh]">
            <p className="font-mono text-sm font-bold text-danger mb-4 break-all">
              {error.name}: {error.message}
            </p>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
          </div>
        </div>
        
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
