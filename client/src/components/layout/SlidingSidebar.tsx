import React, { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { SidebarMenuButton } from "@/components/marketing_ui/sidebar";

interface SlidingSidebarProps {
  showNested: boolean;
  onBack: () => void;
  nestedTitle: string;
  mainMenu: React.ReactNode;
  nestedMenu: React.ReactNode;
  activeItemId?: string;
}

export function SlidingSidebar({
  showNested,
  onBack,
  nestedTitle,
  mainMenu,
  nestedMenu,
  activeItemId = "active-main-menu-item",
}: SlidingSidebarProps) {
  // Scroll active item into view when sliding back to the main menu
  useEffect(() => {
    if (!showNested && activeItemId) {
      // Run on next frame
      requestAnimationFrame(() => {
        const activeEl = document.getElementById(activeItemId);
        if (activeEl) {
          activeEl.scrollIntoView({ block: "center", behavior: "auto" });
        }
      });
    }
  }, [showNested, activeItemId]);

  return (
    <div className="overflow-hidden relative p-0 w-full h-full">
      {/* Sliding Carousel Container */}
      <div
        className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
        style={{ transform: showNested ? "translateX(-100%)" : "translateX(0)" }}
      >
        {/* ==========================================
            PANE 1: MAIN MENU
            ========================================== */}
        <div className="w-full h-full shrink-0 overflow-y-auto pb-10 no-scrollbar">
          {mainMenu}
        </div>

        {/* ==========================================
            PANE 2: NESTED MENU
            ========================================== */}
        <div className="w-full h-full shrink-0 overflow-y-auto pb-10 pt-0 no-scrollbar">
          <div className="group-data-[collapsible=icon]:hidden px-1 pb-1 -mt-1 mx-1">
            <SidebarMenuButton
              asChild
              className="h-9 text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
            >
              <a
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
                className="flex items-center w-full font-medium text-[15px]"
              >
                <ChevronLeft size={16} className="mr-2" />
                <span>{nestedTitle}</span>
              </a>
            </SidebarMenuButton>
          </div>
          {nestedMenu}
        </div>
      </div>
    </div>
  );
}
