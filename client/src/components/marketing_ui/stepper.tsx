import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";

export interface Step {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed based on the active step
  className?: string;
}

export function Stepper({ steps, currentStep, className = "" }: StepperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep the active step visible if there are many steps
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector(
        `[data-step="${currentStep}"]`
      );
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentStep]);

  return (
    <div className={`w-full relative ${className}`}>
      {/* Scrollable Container for massive forms (up to 18 steps) */}
      <div
        ref={scrollRef}
        className="flex items-start w-full overflow-x-auto py-6 px-4 pb-12 snap-x snap-mandatory 
                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const hasNext = index < steps.length - 1;

          return (
            <div
              key={step.id}
              data-step={index}
              className="flex items-center snap-center shrink-0"
            >
              <div className="flex flex-col items-center relative z-10">
                {/* The Circle */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500
                    ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                        : isActive
                        ? "bg-background border-emerald-500 text-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.4)] ring-4 ring-emerald-500/20"
                        : "bg-muted border-muted-foreground/30 text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 animate-in zoom-in duration-300" strokeWidth={3} />
                  ) : (
                    <span
                      className={`text-sm font-bold ${
                        isActive ? "animate-pulse" : ""
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* The Title below the circle */}
                <div
                  className="absolute top-14 flex flex-col items-center text-center w-32"
                >
                  <span
                    className={`text-xs font-semibold tracking-wide uppercase transition-colors duration-300 ${
                      isActive || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.description && isActive && (
                    <span className="text-[10px] text-muted-foreground mt-1 px-1 leading-tight line-clamp-2 animate-in slide-in-from-top-1 fade-in duration-300">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* The Connector Line */}
              {hasNext && (
                <div className="relative w-12 sm:w-16 md:w-24 h-[2px] mx-2 shrink-0 -translate-y-[1.25rem]">
                  {/* Background track line */}
                  <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                  
                  {/* Active fill line */}
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
