import { AppRouter } from "@/app/router";
import { Toaster } from "@/components/marketing_ui/sonner";
import { GlobalErrorBoundary } from "@/components/layout/GlobalErrorBoundary";

export function App() {
  return (
    <GlobalErrorBoundary>
      <AppRouter />
      <Toaster />
    </GlobalErrorBoundary>
  );
}
