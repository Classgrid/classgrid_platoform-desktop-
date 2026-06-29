import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "@/components/marketing_ui/spinner";
import { apiClient } from "@/lib/apiClient";

export function LogoutPage() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    let isMounted = true;
    
    const performLogout = async () => {
      // 1. Wait exactly 3 seconds to show the UI
      const waitPromise = new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. Call backend logout API
      const logoutPromise = apiClient.post("/api/auth/logout").catch(console.error);
      
      await Promise.all([waitPromise, logoutPromise]);
      
      if (!isMounted) return;
      
      // 3. Clear all stored user data
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookies safely
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // 4. Redirect to the correct login page
      const redirectTo = searchParams.get("redirectTo") || "/platform-login";
      
      // Hard redirect to clear React Query cache and memory state completely
      window.location.href = redirectTo + "?logout=success";
    };
    
    performLogout();
    
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0f0f0f]">
      {/* Top-left Classgrid Logo (Triangle) */}
      <div className="absolute top-8 left-8">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L22 20H2L12 2Z" fill="white" />
        </svg>
      </div>
      
      {/* Center Spinner & Text */}
      <Spinner className="w-8 h-8 text-white mb-6" />
      <p className="text-lg font-semibold text-white tracking-tight">Logging out</p>
    </div>
  );
}
