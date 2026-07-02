import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { Clock, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { cn } from "@/lib/utils";

interface NikhilTimeCalendarProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  popDirection?: "up" | "down" | "left" | "right";
}

export function NikhilTimeCalendar({ value, onChange, placeholder = "Pick date & time", className, popDirection = "down" }: NikhilTimeCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const selectCloseGuardRef = React.useRef(false);
  const isSelectOpenRef = React.useRef(false);
  const selectCloseGuardTimerRef = React.useRef<number | undefined>(undefined);
  
  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
  const validValue = isValidDate(value) ? value : undefined;

  const [internalDate, setInternalDate] = useState<Date | undefined>(validValue);
  const [hour, setHour] = useState(validValue ? format(validValue, "hh") : "10");
  const [minute, setMinute] = useState(validValue ? format(validValue, "mm") : "00");
  const [ampm, setAmpm] = useState(validValue ? format(validValue, "a") : "AM");

  // Keep internal state synced if value changes externally
  useEffect(() => {
    if (isValidDate(value)) {
      const validVal = value as Date;
      setInternalDate(validVal);
      setHour(format(validVal, "hh"));
      setMinute(format(validVal, "mm"));
      setAmpm(format(validVal, "a"));
    }
  }, [value]);
  
  // Create month and year state
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState((internalDate || new Date()).getMonth().toString());
  const [selectedYear, setSelectedYear] = useState((internalDate || new Date()).getFullYear().toString());

  // Create arrays for select dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - 50 + i).toString());
  const keepOpenForSelectInteraction = () => {
    selectCloseGuardRef.current = true;
    if (selectCloseGuardTimerRef.current !== undefined) {
      window.clearTimeout(selectCloseGuardTimerRef.current);
    }
    selectCloseGuardTimerRef.current = window.setTimeout(() => {
      if (!isSelectOpenRef.current) {
        selectCloseGuardRef.current = false;
      }
      selectCloseGuardTimerRef.current = undefined;
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (selectCloseGuardTimerRef.current !== undefined) {
        window.clearTimeout(selectCloseGuardTimerRef.current);
      }
    };
  }, []);

  const handleSelectOpenChange = (open: boolean) => {
    isSelectOpenRef.current = open;
    if (open) {
      selectCloseGuardRef.current = true;
      if (selectCloseGuardTimerRef.current !== undefined) {
        window.clearTimeout(selectCloseGuardTimerRef.current);
        selectCloseGuardTimerRef.current = undefined;
      }
      return;
    }
    keepOpenForSelectInteraction();
  };

  const handlePopoverOpenChange = (
    open: boolean,
    event?: Event,
    reason?: string
  ) => {
    if (open) {
      setIsOpen(true);
      return;
    }

    const targetNode = event?.target instanceof Node ? event.target : null;
    const targetElement = targetNode?.nodeType === 3 ? targetNode.parentElement : (targetNode instanceof Element ? targetNode : null);
    
    // Prevent closing if we clicked an element that was instantly unmounted
    if (reason === "click-outside" && event && targetNode && !targetNode.isConnected) {
      event.preventDefault?.();
      setIsOpen(true);
      return;
    }

    // Prevent closing if we clicked inside our nested portals
    const isCalendarSelectEvent =
      selectCloseGuardRef.current ||
      isSelectOpenRef.current ||
      !!targetElement?.closest(
        '[data-calendar-select-content="true"], [role="listbox"], [data-radix-popper-content-wrapper]'
      );

    if (isCalendarSelectEvent) {
      event?.preventDefault?.();
      setIsOpen(true);
      return;
    }

    setIsOpen(false);
  };

  // Handle month/year changes and update calendar date
  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    const newDate = new Date(parseInt(selectedYear), parseInt(val), 1);
    setInternalDate(newDate);
  };

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    const newDate = new Date(parseInt(val), parseInt(selectedMonth), 1);
    setInternalDate(newDate);
  };

  // Combine date and time when apply is clicked
  const handleApply = () => {
    const baseDate = internalDate || new Date();
    const finalDate = new Date(baseDate);
    let h = parseInt(hour);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    
    finalDate.setHours(h);
    finalDate.setMinutes(parseInt(minute));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    onChange(finalDate);
    setIsOpen(false);
  };

  const displayString = isValidDate(value)
    ? `${format(value as Date, 'MMM do, yyyy')} at ${format(value as Date, 'hh:mm a')}`
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal border-border bg-background hover:bg-accent/50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayString}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        align="start" 
        side={popDirection === "up" ? "top" : popDirection === "down" ? "bottom" : popDirection}
        sideOffset={8}
        className="w-auto p-0 border-none shadow-2xl rounded-xl bg-transparent nikhil-time-calendar-content z-[100]"

      >
        {/* The Unified Picker Widget */}
        <div ref={setPortalContainer} data-calendar-container="true" className="relative w-[320px]">
          <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl w-full flex flex-col overflow-hidden">
          
          {/* Custom Month/Year Header */}
          <div className="flex items-center gap-2 p-3 pb-0">
            <div className="flex-1">
              <Select value={selectedMonth} onOpenChange={handleSelectOpenChange} onValueChange={(val) => { keepOpenForSelectInteraction(); handleMonthChange(val); }}>
                <SelectTrigger className="h-8 border-none bg-accent/50 hover:bg-accent rounded-md text-sm font-semibold">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent portalContainer={portalContainer} data-calendar-select-content="true">
                  {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedYear} onOpenChange={handleSelectOpenChange} onValueChange={(val) => { keepOpenForSelectInteraction(); handleYearChange(val); }}>
                <SelectTrigger className="h-8 border-none bg-accent/50 hover:bg-accent rounded-md text-sm font-semibold">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent portalContainer={portalContainer} data-calendar-select-content="true">
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="px-3 pb-3">
            <Calendar
              mode="single"
              month={internalDate || new Date()}
              onMonthChange={setInternalDate}
              selected={internalDate}
              fixedWeeks={true}
              showOutsideDays={true}
              onSelect={(d) => {
                if (d) {
                  setInternalDate(d);
                  setSelectedMonth(d.getMonth().toString());
                  setSelectedYear(d.getFullYear().toString());
                }
              }}
              className="bg-transparent p-0 mt-3 flex justify-center"
              classNames={{
                months: "bg-transparent",
                month: "bg-transparent",
                month_caption: "hidden", // Hide original header
                nav: "hidden", // Hide navigation arrows
                caption: "hidden",
                table: "w-full border-collapse space-y-1 mx-auto",
              }}
            />
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Time Picker Section */}
          <div className="p-4 flex flex-col gap-3 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Clock size={16} />
              <span>Select Time</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-[2]">
                <Select value={hour} onOpenChange={handleSelectOpenChange} onValueChange={(val) => { keepOpenForSelectInteraction(); setHour(val); }}>
                  <SelectTrigger className="h-9 border-border bg-background rounded-md text-sm font-medium">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent portalContainer={portalContainer} data-calendar-select-content="true">
                    {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-lg font-bold text-muted-foreground pb-1">:</span>
              <div className="flex-[2]">
                <Select value={minute} onOpenChange={handleSelectOpenChange} onValueChange={(val) => { keepOpenForSelectInteraction(); setMinute(val); }}>
                  <SelectTrigger className="h-9 border-border bg-background rounded-md text-sm font-medium">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent portalContainer={portalContainer} data-calendar-select-content="true">
                    {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-2" />
              <div className="flex-[2]">
                <Select value={ampm} onOpenChange={handleSelectOpenChange} onValueChange={(val) => { keepOpenForSelectInteraction(); setAmpm(val); }}>
                  <SelectTrigger className="h-9 border-none bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md text-sm font-bold">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent portalContainer={portalContainer} data-calendar-select-content="true">
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Action Button */}
          <div className="p-3 bg-muted/20 border-t border-border">
            <Button 
              type="button" 
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium" 
              onClick={handleApply}
            >
              Apply Date & Time
            </Button>
          </div>
        </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
