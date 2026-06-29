import React from 'react';
import { ArrowRight } from 'lucide-react';

export function PlatformHubPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="max-w-md w-full bg-card text-card-foreground border border-border rounded-xl p-8 text-center shadow-sm">
        <img 
          src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png" 
          alt="Classgrid Logo" 
          className="w-20 h-20 object-contain mx-auto mb-6"
        />
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Classgrid Platform
        </h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Welcome to the central Classgrid platform. If you are a student or faculty member, please access your institution's specific portal URL to log in.
        </p>
        
        <a 
          href="https://classgrid.in"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Visit main website
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      
      <div className="mt-8 text-muted-foreground text-xs font-medium">
        &copy; {new Date().getFullYear()} Classgrid Education. All rights reserved.
      </div>
    </div>
  );
}
