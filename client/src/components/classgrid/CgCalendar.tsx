import React, { useState } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isToday,
  parseISO
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CgButton } from "./Button";

export interface CalendarEvent {
  id: string;
  date: Date | string;
  title: string;
  type: 'lecture' | 'exam' | 'holiday' | 'attendance' | 'other';
  color?: string;
}

interface CgCalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date, dayEvents: CalendarEvent[]) => void;
  className?: string;
}

export function CgCalendar({ events = [], onDateClick, className }: CgCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const onDateSelect = (day: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(day);
    if (onDateClick) {
      onDateClick(day, dayEvents);
    }
  };

  // Extract events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
      return isSameDay(eventDate, day);
    });
  };

  // Render Header (Month / Year Navigation)
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card rounded-t-xl">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground m-0">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <CgButton variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs font-medium px-3">
            Today
          </CgButton>
          <div className="flex items-center bg-muted rounded-md p-1">
            <button 
              onClick={prevMonth}
              className="p-1 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextMonth}
              className="p-1 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Days of Week
  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-xs text-muted-foreground uppercase py-3 border-b border-border bg-muted/20">
          {format(addDays(startDate, i), "EEE")}
        </div>
      );
    }
    return <div className="grid grid-cols-7">{days}</div>;
  };

  // Render Calendar Cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const dayEvents = getEventsForDay(cloneDay);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateSelect(cloneDay, dayEvents)}
            className={cn(
              "min-h-[100px] border-b border-r border-border p-2 transition-all cursor-pointer relative group",
              !isCurrentMonth ? "bg-muted/10 text-muted-foreground/50" : "bg-card text-foreground hover:bg-accent/5",
              isSelected ? "bg-accent/10 shadow-[inset_0_0_0_1px_hsl(var(--primary))]" : "",
              i === 6 ? "border-r-0" : ""
            )}
          >
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                isTodayDate ? "bg-primary text-primary-foreground" : "",
                isSelected && !isTodayDate ? "text-primary font-bold" : ""
              )}>
                {formattedDate}
              </span>
              
              {/* Event Badge Counter */}
              {dayEvents.length > 0 && (
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                  {dayEvents.length}
                </span>
              )}
            </div>

            {/* Render Events */}
            <div className="mt-2 flex flex-col gap-1 overflow-y-auto max-h-[60px] no-scrollbar">
              {dayEvents.slice(0, 3).map((evt) => (
                <div 
                  key={evt.id} 
                  className={cn(
                    "text-[10px] truncate px-1.5 py-1 rounded border",
                    evt.type === 'lecture' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                    evt.type === 'exam' ? "bg-destructive/10 text-destructive border-destructive/20" :
                    evt.type === 'holiday' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                    "bg-muted text-muted-foreground border-border"
                  )}
                  title={evt.title}
                >
                  {evt.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={cn("bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden", className)}>
      {renderHeader()}
      {renderDays()}
      <div className="flex-1 overflow-hidden">
        {renderCells()}
      </div>
    </div>
  );
}
