import { AppRouter } from "@/app/router";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}
