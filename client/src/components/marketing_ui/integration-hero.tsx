"use client";

import { Button } from "@/components/ui/button";
import { SectionAccentBar } from "@/components/ui/section-accent-bar";
import React from "react";

const ICONS_ROW1 = [
  "/integrations/aws.svg",
  "https://cdn.simpleicons.org/razorpay/02042B",
  "https://cdn.simpleicons.org/zoom/2D8CFF",
  "https://cdn.simpleicons.org/googlemeet/00832D",
  "https://cdn.simpleicons.org/supabase/3ECF8E",
];

const ICONS_ROW2 = [
  "https://cdn.simpleicons.org/redis/FF4438",
  "https://cdn.simpleicons.org/brevo/0092FF",
  "/integrations/openai.svg",
  "https://cdn.simpleicons.org/stripe/008CDD",
  "https://cdn.simpleicons.org/agora/099DFD",
];

// Utility to repeat icons enough times
const repeatedIcons = (icons: string[], repeat = 4) => Array.from({ length: repeat }).flatMap(() => icons);

export default function IntegrationHero() {
  return (
    <section className="relative py-32 overflow-hidden bg-transparent">
      {/* Light grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <span className="inline-block px-3 py-1 mb-4 text-sm rounded-full border border-border bg-muted text-muted-foreground">
          ⚡ Integrations
        </span>
        <SectionAccentBar />
        <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
          Integrate with favorite tools
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-white max-w-xl mx-auto">
          250+ top apps are available to integrate seamlessly with your workflow.
        </p>
        <Button variant="default" className="mt-8 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90">
          Get started
        </Button>

        {/* Carousel */}
        <div className="mt-12 overflow-hidden relative pb-2">
          {/* Row 1 */}
          <div className="flex gap-10 whitespace-nowrap animate-scroll-left">
            {repeatedIcons(ICONS_ROW1, 4).map((src, i) => (
              <div key={i} className="h-16 w-16 flex-shrink-0 rounded-full bg-white dark:bg-gray-300 shadow-md flex items-center justify-center">
                <img src={src} alt="icon" className="h-10 w-10 object-contain" />
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-10 whitespace-nowrap mt-6 animate-scroll-right">
            {repeatedIcons(ICONS_ROW2, 4).map((src, i) => (
              <div key={i} className="h-16 w-16 flex-shrink-0 rounded-full bg-white dark:bg-gray-300 shadow-md flex items-center justify-center">
                <img src={src} alt="icon" className="h-10 w-10 object-contain" />
              </div>
            ))}
          </div>

          {/* Fade overlays */}
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white dark:from-black to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white dark:from-black to-transparent pointer-events-none" />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
      `}</style>
    </section>
  );
}
