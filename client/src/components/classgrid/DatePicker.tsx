import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

export interface CgDatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CgDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className = "",
}: CgDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Clean CSS for the day picker inside our popover
  const classNames = {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted hover:text-foreground rounded-md transition-colors",
    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    day_today: "bg-accent text-accent-foreground font-semibold",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50",
    day_hidden: "invisible",
    caption_dropdowns: "flex gap-1 items-center justify-center",
    dropdown: "bg-transparent border border-border rounded-md text-sm p-1",
    dropdown_month: "mr-1",
    dropdown_year: "ml-1",
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`flex h-9 w-full items-center justify-start rounded-md border border-border bg-background px-3 py-2 text-sm text-left shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-muted/30 ${
            !value ? "text-muted-foreground" : "text-foreground"
          } ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {value ? format(value, "dd MMM, yyyy") : <span>{placeholder}</span>}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md outline-none animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange?.(d)
              setOpen(false)
            }}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2035}
            classNames={classNames}
            showOutsideDays
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
