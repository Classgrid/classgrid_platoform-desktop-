"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { RoleDataMap } from "./radial-orbital-timeline";

const RadialOrbitalTimeline = dynamic(() => import("./radial-orbital-timeline"), { ssr: false });

type RadialOrbitalTimelineWrapperProps = {
  rings: string[][];
  activeTab: string;
  roleDataMap?: RoleDataMap;
};

export default function RadialOrbitalTimelineWrapper({ rings, activeTab, roleDataMap }: RadialOrbitalTimelineWrapperProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return <div className="mx-auto w-full max-w-[850px] h-[500px] bg-background/5 animate-pulse rounded-3xl" />;
  
  return <RadialOrbitalTimeline rings={rings} activeTab={activeTab} roleDataMap={roleDataMap} />;
}
