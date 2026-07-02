import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { Clock, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { cn } from "@/lib/utils";

interface NikhilTimeCalendarProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function NikhilTimeCalendar({ value, onChange, placeholder = "Pick date & time", className }: NikhilTimeCalendarProps) {
  const [internalDate, setInternalDate] = useState<Date | undefined>(value);
  const [hour, setHour] = useState(value ? format(value, "hh") : "10");
  const [minute, setMinute] = useState(value ? format(value, "mm") : "00");
  const [ampm, setAmpm] = useState(value ? format(value, "a") : "AM");

  // Keep internal state synced if value changes externally
  useEffect(() => {
    if (value) {
      setInternalDate(value);
      setHour(format(value, "hh"));
      setMinute(format(value, "mm"));
      setAmpm(format(value, "a"));
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
    if (!internalDate) {
      onChange(undefined);
      return;
    }
    const finalDate = new Date(internalDate);
    let h = parseInt(hour);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    
    finalDate.setHours(h);
    finalDate.setMinutes(parseInt(minute));
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    onChange(finalDate);
  };

  const displayString = value 
    ? `${format(value, 'MMM do, yyyy')} at ${format(value, 'hh:mm a')}`
    : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
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
        className="w-auto p-0 border-none shadow-2xl rounded-xl bg-transparent" 
        align="start"
        onInteractOutside={(e) => {
          // Prevent closing when clicking inside a nested select/portal
          const target = e.target as Element;
          if (target.closest('[data-radix-portal]')) {
            e.preventDefault();
          }
        }}
      >
        
        {/* The Unified Picker Widget */}
        <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl w-[320px] flex flex-col overflow-hidden">
          
          {/* Custom Month/Year Header */}
          <div className="flex items-center gap-2 p-3 pb-0">
            <div className="flex-1">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 border-none bg-accent/50 hover:bg-accent rounded-md text-sm font-semibold">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 border-none bg-accent/50 hover:bg-accent rounded-md text-sm font-semibold">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
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
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="h-9 border-border bg-background rounded-md text-sm font-medium">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
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
                    {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
            
            <Button onClick={handleApply} className="w-full mt-2 h-9 rounded-md font-semibold text-sm">
              Apply Date & Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
