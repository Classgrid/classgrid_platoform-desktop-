import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mb-8 border border-border/50 shadow-2xl relative">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse opacity-50" />
          <AlertCircle className="w-10 h-10 text-primary relative z-10" />
        </div>
        
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50 mb-4 tracking-tighter">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Page Not Found
        </h2>
        
        <p className="text-muted-foreground mb-10 text-sm max-w-[320px] mx-auto leading-relaxed">
          We couldn't find the page or institution URL you were looking for. It might have been moved, deleted, or doesn't exist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-muted/50 text-foreground hover:bg-muted border border-border/50 px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
