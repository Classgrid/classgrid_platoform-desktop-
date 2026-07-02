import React, { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { cn } from "@/lib/utils";

interface NikhilTimeCalendarProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  popDirection?: "up" | "down" | "left" | "right";
}

export function NikhilTimeCalendar({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  popDirection = "down",
}: NikhilTimeCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
  const validValue = isValidDate(value) ? value : undefined;

  const [internalDate, setInternalDate] = useState<Date | undefined>(validValue);
  const [hour, setHour] = useState(validValue ? format(validValue, "hh") : "10");
  const [minute, setMinute] = useState(validValue ? format(validValue, "mm") : "00");
  const [ampm, setAmpm] = useState(validValue ? format(validValue, "a") : "AM");
  const [selectedMonth, setSelectedMonth] = useState((validValue || new Date()).getMonth().toString());
  const [selectedYear, setSelectedYear] = useState((validValue || new Date()).getFullYear().toString());

  useEffect(() => {
    if (isValidDate(value)) {
      const v = value as Date;
      setInternalDate(v);
      setHour(format(v, "hh"));
      setMinute(format(v, "mm"));
      setAmpm(format(v, "a"));
      setSelectedMonth(v.getMonth().toString());
      setSelectedYear(v.getFullYear().toString());
    }
  }, [value]);

  // Calculate position of the floating panel relative to the trigger
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelW = 320;
    const panelH = 520; // approx height
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top: number;
    let left: number;

    if (popDirection === "up") {
      top = rect.top - panelH - 8;
      left = rect.left;
    } else if (popDirection === "left") {
      top = rect.top;
      left = rect.left - panelW - 8;
    } else if (popDirection === "right") {
      top = rect.top;
      left = rect.right + 8;
    } else {
      // down
      top = rect.bottom + 8;
      left = rect.left;
    }

    // Clamp so it doesn't go off-screen
    if (left + panelW > vw - 16) left = vw - panelW - 16;
    if (left < 16) left = 16;
    if (top + panelH > vh - 16) top = vh - panelH - 16;
    if (top < 16) top = 16;

    const style: React.CSSProperties = { position: "fixed", top, left, width: panelW, zIndex: 9999 };
    return style;
  }, [popDirection]);

  // Compute position synchronously when opening
  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        // Will open — compute position now
        requestAnimationFrame(() => updatePosition());
      }
      return !prev;
    });
  }, [updatePosition]);

  // Reposition + outside-click listener
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999, width: 320, zIndex: 9999 });
  useEffect(() => {
    if (!isOpen) return;
    const style = updatePosition();
    if (style) setPanelStyle(style);

    const onResize = () => { const s = updatePosition(); if (s) setPanelStyle(s); };
    const onScroll = () => { const s = updatePosition(); if (s) setPanelStyle(s); };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return; // click is inside our widget
      }
      // Check if click is inside a Radix Select portal (they render to body)
      const el = e.target as Element;
      if (el?.closest?.('[role="listbox"], [data-radix-popper-content-wrapper]')) {
        return; // click is inside a Select dropdown
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("mousedown", handleOutsideClick, true);
    };
  }, [isOpen, updatePosition]);

  const currentYear = new Date().getFullYear();
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - 50 + i).toString());

  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    setInternalDate(new Date(parseInt(selectedYear), parseInt(val), 1));
  };

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    setInternalDate(new Date(parseInt(val), parseInt(selectedMonth), 1));
  };

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
    ? `${format(value as Date, "MMM do, yyyy")} at ${format(value as Date, "hh:mm a")}`
    : placeholder;

  return (
    <>
      {/* Trigger Button */}
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={toggleOpen}
        className={cn(
          "w-full justify-start text-left font-normal border-border bg-background hover:bg-accent/50",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayString}
      </Button>

      {/* Calendar panel — rendered with position:fixed, NOT inside any popover portal */}
      {isOpen && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Month / Year header */}
          <div className="flex items-center gap-2 p-3 pb-0">
            <div className="flex-1">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 border-none bg-accent/50 hover:bg-accent rounded-md text-sm font-semibold">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 border-none bg-accent/50 hover:bg-accent rounded-md text-sm font-semibold">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar grid */}
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
                month_caption: "hidden",
                nav: "hidden",
                caption: "hidden",
                table: "w-full border-collapse space-y-1 mx-auto",
              }}
            />
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Time picker */}
          <div className="p-4 flex flex-col gap-3 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Clock size={16} />
              <span>Select Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-[2]">
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="h-9 border-border bg-background rounded-md text-sm font-medium">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-lg font-bold text-muted-foreground pb-1">:</span>
              <div className="flex-[2]">
                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="h-9 border-border bg-background rounded-md text-sm font-medium">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-2" />
              <div className="flex-[2]">
                <Select value={ampm} onValueChange={setAmpm}>
                  <SelectTrigger className="h-9 border-none bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md text-sm font-bold">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Apply button */}
          <div className="p-3 bg-muted/20 border-t border-border rounded-b-xl">
            <Button
              type="button"
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium"
              onClick={handleApply}
            >
              Apply Date &amp; Time
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
