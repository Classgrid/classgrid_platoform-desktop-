/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";

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

  // Create options for dropdowns
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const v = (i + 1).toString().padStart(2, "0");
    return { label: v, value: v };
  });
  
  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    const v = i.toString().padStart(2, "0");
    return { label: v, value: v };
  });
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];
  const monthOptions = monthNames.map((m, i) => ({ label: m, value: i.toString() }));
  
  const yearOptions = Array.from({ length: 100 }, (_, i) => {
    const v = (currentYear + i).toString();
    return { label: v, value: v };
  });

  const ampmOptions = [
    { label: "AM", value: "AM" },
    { label: "PM", value: "PM" }
  ];

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

  const handleApply = () => {
    const baseDate = internalDate || new Date();
    const finalDate = new Date(baseDate);
    if (showTime) {
      let h = parseInt(hour);
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      finalDate.setHours(h);
      finalDate.setMinutes(parseInt(minute));
      finalDate.setSeconds(0);
      finalDate.setMilliseconds(0);
    } else {
      finalDate.setHours(0, 0, 0, 0);
    }
    onChange(finalDate);
    setIsOpen(false);
  };

  const displayString = isValidDate(value)
    ? showTime
      ? `${format(value as Date, "MMM do, yyyy")} at ${format(value as Date, "hh:mm a")}`
      : format(value as Date, "MMM do, yyyy")
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-border bg-background hover:bg-accent/50 overflow-hidden",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-1.5 h-4 w-4 shrink-0" />
          <span className="truncate min-w-0">{displayString}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side={popDirection === "up" ? "top" : popDirection === "down" ? "bottom" : popDirection as any}
        sideOffset={8}
        className="w-auto p-0 border-none shadow-2xl rounded-xl bg-transparent z-[1000] nikhil-time-calendar-portal"
      >
        <div
          // Removed overflow-hidden so our custom dropdowns can pop out seamlessly!
          className="bg-popover text-popover-foreground border border-border rounded-xl shadow-xl w-[320px] flex flex-col"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Date Type Toggle — only shown when parent passes dateType props */}
          {onDateTypeChange && (
            <div className="px-3 pt-3 pb-1">
              <div className="flex items-center rounded-lg overflow-hidden border border-border bg-muted/40 text-xs font-semibold">
                <button
                  type="button"
                  onMouseDown={(e) => { e.stopPropagation(); onDateTypeChange("createdAt"); }}
                  className={cn(
                    "flex-1 py-1.5 text-center transition-colors",
                    dateType === "createdAt"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Creation Date
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.stopPropagation(); onDateTypeChange("meetingScheduledAt"); }}
                  className={cn(
                    "flex-1 py-1.5 text-center transition-colors",
                    dateType === "meetingScheduledAt"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Schedule Date
                </button>
              </div>
            </div>
          )}

          {/* Custom Month/Year Header */}
          <div className="flex items-center gap-2 p-3 pb-0">
            <div className="flex-1">
              <CustomSelect 
                value={selectedMonth} 
                onValueChange={handleMonthChange} 
                options={monthOptions}
                className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                dropdownClassName="w-40 -ml-2"
              />
            </div>
            <div className="flex-1">
              <CustomSelect 
                value={selectedYear} 
                onValueChange={handleYearChange} 
                options={yearOptions}
                className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                dropdownClassName="w-32"
              />
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

          {/* Time Picker Section — only when showTime is true */}
          {showTime && (
            <>
              <div className="w-full h-px bg-border/50" />
              <div className="p-4 flex flex-col gap-3 bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                  <Clock size={16} />
                  <span>Select Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-[2]">
                    <CustomSelect 
                      value={hour} 
                      onValueChange={setHour} 
                      options={hourOptions}
                      className="h-9 border-border bg-background font-medium"
                      dropUp={true}
                    />
                  </div>
                  <span className="text-lg font-bold text-muted-foreground pb-1">:</span>
                  <div className="flex-[2]">
                    <CustomSelect 
                      value={minute} 
                      onValueChange={setMinute} 
                      options={minuteOptions}
                      className="h-9 border-border bg-background font-medium"
                      dropUp={true}
                    />
                  </div>
                  <div className="w-2" />
                  <div className="flex-[2]">
                    <CustomSelect 
                      value={ampm} 
                      onValueChange={setAmpm} 
                      options={ampmOptions}
                      className="h-9 border-none bg-emerald-500/10 text-emerald-500 font-bold hover:bg-emerald-500/20"
                      dropUp={true}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="p-3 bg-muted/20 border-t border-border rounded-b-xl">
            <Button
              type="button"
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium"
              onClick={handleApply}
            >
              {showTime ? "Apply Date & Time" : "Apply Date"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
