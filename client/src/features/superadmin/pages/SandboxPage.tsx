import React, { useState } from 'react';
import { Calendar } from '@/components/marketing_ui/calendar';

export function SandboxPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <h1 className="text-4xl font-bold tracking-tight mb-12">Component Sandbox</h1>
      
      {/* Just the raw component, absolutely no extra boxes, borders, or sections */}
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
      />
    </div>
  );
}
