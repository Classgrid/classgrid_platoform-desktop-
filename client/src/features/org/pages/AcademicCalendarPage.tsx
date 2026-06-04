import React, { useState } from "react";
import { format, isToday } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, Users, MapPin, AlertCircle, Plus } from "lucide-react";
import { CgCalendar, CalendarEvent } from "@/components/classgrid/CgCalendar";
import { useAcademicCalendar } from "../queries/useAcademicCalendar";
import { CgButton } from "@/components/classgrid/Button";

export function AcademicCalendarPage() {
  const { data: events, isLoading } = useAcademicCalendar();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

  // We set the initial selected events once the data loads
  React.useEffect(() => {
    if (events && selectedEvents.length === 0) {
      const todayEvents = events.filter(e => 
        format(new Date(e.date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
      );
      setSelectedEvents(todayEvents);
    }
  }, [events]);

  const handleDateClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(date);
    setSelectedEvents(dayEvents);
  };

  if (isLoading) {
    return (
      <div className="cg-page animate-pulse flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="cg-page h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      <div className="cg-page__header cg-page__header--split shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
          <p className="text-muted-foreground">Manage organization-wide events, exams, and holidays.</p>
        </div>
        <div className="flex gap-3">
          <CgButton variant="default">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </CgButton>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 min-h-0 overflow-hidden pb-6">
        
        {/* Left Side: The Interactive Calendar (Spans 8 columns) */}
        <div className="lg:col-span-8 h-full flex flex-col min-h-0">
          <CgCalendar 
            events={events || []} 
            onDateClick={handleDateClick}
            className="h-full"
          />
        </div>

        {/* Right Side: Data Dashboard / Drill-down Panel (Spans 4 columns) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          
          {/* Panel Header */}
          <div className="p-5 border-b border-border bg-muted/20 shrink-0">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {isToday(selectedDate) ? "Today's Agenda" : format(selectedDate, "EEEE")}
            </p>
          </div>

          {/* Panel Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
            {selectedEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70 py-10">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-base font-semibold">No scheduled events</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  There are no lectures, exams, or holidays recorded for this date.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedEvents.map((evt) => (
                  <div 
                    key={evt.id} 
                    className="p-4 rounded-lg border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {evt.title}
                      </h4>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        evt.type === 'lecture' ? "bg-blue-500/10 text-blue-600" :
                        evt.type === 'exam' ? "bg-destructive/10 text-destructive" :
                        evt.type === 'holiday' ? "bg-green-500/10 text-green-600" :
                        evt.type === 'attendance' ? "bg-orange-500/10 text-orange-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {evt.type}
                      </span>
                    </div>
                    
                    {/* Simulated Context Data based on Type */}
                    <div className="space-y-1.5 mt-3">
                      {evt.type === 'lecture' && (
                        <>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> 10:00 AM - 11:30 AM
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> Dr. Sharma (Physics Dept)
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Room 402, Science Block
                          </p>
                        </>
                      )}
                      
                      {evt.type === 'exam' && (
                        <>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> 09:00 AM - 12:00 PM
                          </p>
                          <p className="text-xs text-destructive flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> Strict invigilation active
                          </p>
                        </>
                      )}

                      {evt.type === 'holiday' && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Campus closed for all students and faculty.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Panel Footer */}
          <div className="p-4 border-t border-border bg-background shrink-0">
            <CgButton variant="outline" className="w-full text-xs font-semibold">
              View Full Weekly Schedule
            </CgButton>
          </div>

        </div>

      </div>
    </div>
  );
}
