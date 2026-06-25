import React, { useState } from 'react';
import { Calendar } from '@/components/marketing_ui/calendar';

export function SandboxPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Component Sandbox</h1>
      <div className="space-y-8 flex flex-col items-start">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm w-fit">
           <h2 className="text-xl font-bold text-primary mb-4">1. Calendar (Tailwind)</h2>
           <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow p-3"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Selected Date: {date ? date.toDateString() : "None"}
            </p>
        </div>
      </div>
    </div>
  );
}
