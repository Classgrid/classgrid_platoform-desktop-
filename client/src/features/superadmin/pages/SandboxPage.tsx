import React, { useState } from 'react';
import { Calendar } from '@/components/marketing_ui/calendar';

export function SandboxPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Component Sandbox</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Testing components with proper spacing and realistic container sizes.
          </p>
        </div>
        
        <section className="space-y-6">
           <h2 className="text-xl font-bold text-slate-800 border-b pb-2">1. Calendar Component</h2>
           
           <div className="bg-white border rounded-2xl shadow-sm p-8 md:p-16 flex flex-col items-center justify-center min-h-[400px]">
             
             {/* Medium-sized realistic container */}
             <div className="w-full max-w-md flex flex-col items-center space-y-8">
               
               <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-xl border shadow-sm p-4 bg-white"
                />

                <div className="w-full p-4 bg-slate-50 border rounded-lg text-center">
                  <p className="text-sm font-medium text-slate-500 mb-1">Selected Date</p>
                  <p className="text-lg font-bold text-slate-900">
                    {date ? date.toDateString() : "No date selected"}
                  </p>
                </div>

             </div>

           </div>
        </section>

      </div>
    </div>
  );
}
