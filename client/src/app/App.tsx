import { AppRouter } from "@/app/router";
import { Toaster } from "@/components/marketing_ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
      <HotToaster position="bottom-right" />
    </>
  );
}
