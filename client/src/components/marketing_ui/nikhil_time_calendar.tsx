import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { Clock, Calendar as CalendarIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { cn } from "@/lib/utils";

interface NikhilTimeCalendarProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  popDirection?: "up" | "down" | "left" | "right";
}

// Custom Native Select that looks EXACTLY like Radix Select but without Portal conflicts
function NativeSelect({
  value,
  onChange,
  className,
  children,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-md border-none", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full w-full appearance-none bg-transparent pl-3 pr-8 text-sm font-semibold text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-ring"
        // Prevent click from bubbling up and triggering outside-click on Popover
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-50">
        <ChevronDownIcon className="h-4 w-4" />
      </div>
    </div>
  );
}

export function NikhilTimeCalendar({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  popDirection = "down",
}: NikhilTimeCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

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

  // Create arrays for dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const months = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - 50 + i).toString());

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
    ? `${format(value as Date, "MMM do, yyyy")} at ${format(value as Date, "hh:mm a")}`
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
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
        className="w-auto p-0 border-none shadow-2xl rounded-xl bg-transparent z-[100] nikhil-time-calendar-portal"
      >
        <div
          className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl w-[320px] flex flex-col overflow-hidden"
          // Prevent any click inside from bubbling out and closing popover
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Custom Month/Year Header using native selects */}
          <div className="flex items-center gap-2 p-3 pb-0">
            <div className="flex-1">
              <NativeSelect value={selectedMonth} onChange={handleMonthChange} className="h-8 bg-accent/50 hover:bg-accent">
                {months.map((m, i) => (
                  <option key={i} value={i.toString()}>{m}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex-1">
              <NativeSelect value={selectedYear} onChange={handleYearChange} className="h-8 bg-accent/50 hover:bg-accent">
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </NativeSelect>
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
                month_caption: "hidden",
                nav: "hidden",
                caption: "hidden",
                table: "w-full border-collapse space-y-1 mx-auto",
              }}
            />
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Time Picker Section using native selects */}
          <div className="p-4 flex flex-col gap-3 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Clock size={16} />
              <span>Select Time</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-[2]">
                <NativeSelect value={hour} onChange={setHour} className="h-9 bg-background border border-border">
                  {hours.map((h) => <option key={h} value={h}>{h}</option>)}
                </NativeSelect>
              </div>
              <span className="text-lg font-bold text-muted-foreground pb-1">:</span>
              <div className="flex-[2]">
                <NativeSelect value={minute} onChange={setMinute} className="h-9 bg-background border border-border">
                  {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
                </NativeSelect>
              </div>
              <div className="w-2" />
              <div className="flex-[2]">
                <NativeSelect value={ampm} onChange={setAmpm} className="h-9 bg-emerald-500/10 text-emerald-500 font-bold [&>select]:text-emerald-500">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </NativeSelect>
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
              Apply Date &amp; Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
