import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Command } from "cmdk"

type Option = {
  label: string
  value: string
  disabled?: boolean
}

export interface CgSearchableSelectProps {
  value?: string
  onValueChange: (value: string) => void
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  allowClear?: boolean
}

export function CgSearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className = "",
  allowClear = false,
}: CgSearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("")
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-muted/30 ${className}`}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <div className="flex items-center gap-1 opacity-50">
            {allowClear && selectedOption && (
              <X size={14} className="cursor-pointer hover:opacity-100" onClick={handleClear} />
            )}
            <ChevronDown size={14} />
          </div>
        </button>
      </PopoverPrimitive.Trigger>
      
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <Command className="flex h-full w-full flex-col overflow-hidden bg-transparent">
            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </Command.Empty>
              
              {filteredOptions.map((opt) => (
                <Command.Item
                  key={opt.value}
                  value={opt.label}
                  disabled={opt.disabled}
                  onSelect={() => {
                    onValueChange(opt.value)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                  className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 hover:bg-muted/50 ${opt.value === value ? "bg-muted font-medium" : ""}`}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${value === opt.value ? "opacity-100" : "opacity-0"}`}
                  />
                  {opt.label}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
