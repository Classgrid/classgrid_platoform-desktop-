import React from 'react';
import { ArrowRight, Server, Shield, Activity } from 'lucide-react';

export function PlatformHubPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="max-w-2xl w-full bg-card text-card-foreground border border-border rounded-2xl p-10 text-center shadow-lg">
        
        {/* Middle Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png" 
            alt="Classgrid Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          Classgrid Command Center
        </h1>
        
        <p className="text-muted-foreground mb-8 text-base leading-relaxed max-w-lg mx-auto">
          You have reached the core routing infrastructure of Classgrid. This is the central command center that powers and controls our entire platform, APIs, and tenant networks.
        </p>
        
        {/* Realistic Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-1 border border-border text-sm font-medium text-foreground shadow-sm">
            <Server className="w-4 h-4 text-primary" />
            Core Infrastructure Online
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-1 border border-border text-sm font-medium text-foreground shadow-sm">
            <Activity className="w-4 h-4 text-primary" />
            Global Routing Active
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-1 border border-border text-sm font-medium text-foreground shadow-sm">
            <Shield className="w-4 h-4 text-primary" />
            Network Secured
          </div>
        </div>

        {/* Official Website Link */}
        <div className="flex justify-center">
          <a 
            href="https://classgrid.in"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            Visit Official Website
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      <div className="mt-10 text-muted-foreground text-sm font-medium">
        &copy; {new Date().getFullYear()} Classgrid Education. All rights reserved.
      </div>
    </div>
  );
}
