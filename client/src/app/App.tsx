import { AppRouter } from "@/app/router";
import { Toaster } from "@/components/marketing_ui/sonner";

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}
