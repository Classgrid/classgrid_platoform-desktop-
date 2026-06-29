import React from 'react';
import { Activity, CheckCircle2, Server, Shield, Globe } from 'lucide-react';

export function PlatformHubPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 animate-pulse" />
      
      <div className="max-w-3xl w-full bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-10 backdrop-blur-xl text-center shadow-2xl z-10">
        {/* Logo Area */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Server className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Classgrid <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Platform</span>
            </h1>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-sm font-semibold tracking-wide uppercase">All Frontend Systems Operational</span>
        </div>

        <h2 className="text-2xl font-semibold text-neutral-100 mb-5">
          Welcome to the Core Routing Engine
        </h2>
        
        <p className="text-neutral-400 mb-12 max-w-xl mx-auto leading-relaxed text-lg">
          The central infrastructure is fully online. All tenant instances, dynamic domains, and APIs are actively running and routing traffic correctly across the Classgrid network.
        </p>

        {/* Grid of metrics/features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-2xl bg-neutral-800/40 border border-neutral-700/50 hover:bg-neutral-800/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-base font-semibold text-white">Dynamic Routing</div>
            <div className="text-sm text-neutral-500 mt-1">Active for all tenants</div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-800/40 border border-neutral-700/50 hover:bg-neutral-800/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-base font-semibold text-white">Frontend Engine</div>
            <div className="text-sm text-neutral-500 mt-1">100% Online & Stable</div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-800/40 border border-neutral-700/50 hover:bg-neutral-800/60 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-base font-semibold text-white">Global Security</div>
            <div className="text-sm text-neutral-500 mt-1">WAF & SSL Active</div>
          </div>
        </div>
      </div>
      
      <div className="mt-10 text-neutral-500 text-sm flex items-center gap-2 font-medium">
        <Activity className="w-4 h-4" />
        <span>Classgrid Global Network &bull; Edge Node</span>
      </div>
    </div>
  );
}
