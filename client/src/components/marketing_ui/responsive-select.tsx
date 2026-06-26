import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { NativeSelect, NativeSelectOption } from "./native-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

export interface ResponsiveSelectProps
  extends Omit<React.ComponentProps<"select">, "size"> {
  size?: "sm" | "default"
  placeholder?: string
}

export function ResponsiveSelect({
  className,
  size = "default",
  children,
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}: ResponsiveSelectProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Extract options from children to use in custom select
  const options = React.useMemo(() => {
    const opts: { value: string; label: React.ReactNode; color?: string }[] = []
    
    const flattenChildren = (kids: any) => {
      React.Children.forEach(kids, (child) => {
        if (!React.isValidElement<any>(child)) return;
        if (child.type === React.Fragment) {
          flattenChildren(child.props.children);
        } else if (child.props && (child.props.value !== undefined || child.type === "option")) {
          let val = String(child.props.value !== undefined ? child.props.value : child.props.children);
          if (val === "") val = "__empty__";
          opts.push({
            value: val,
            label: child.props.children,
            color: child.props["data-color"]
          })
        }
      })
    }
    
    flattenChildren(children)
    return opts
  }, [children])

  // Custom Select (Desktop)
  if (isDesktop) {
    let displayValue = value !== undefined ? String(value) : undefined;
    if (displayValue === "") displayValue = "__empty__";

    // Find the currently selected label for the value placeholder
    const selectedOption = options.find((opt) => opt.value === displayValue)
    
    return (
      <Select
        value={displayValue}
        onValueChange={(val) => {
          if (onChange) {
            const trueVal = val === "__empty__" ? "" : val;
            // Mock a synthetic event for drop-in compatibility
            const event = {
              target: { value: trueVal },
              currentTarget: { value: trueVal },
              preventDefault: () => {},
              stopPropagation: () => {},
            } as any
            onChange(event)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className={className} size={size}>
          <SelectValue asChild>
            <div className="flex items-center gap-2 text-foreground flex-1 text-left truncate">
              {selectedOption?.color && (
                <span className={`shrink-0 w-2 h-2 rounded-full ${selectedOption.color}`} />
              )}
              <span className="truncate">{selectedOption ? selectedOption.label : (placeholder || "Select...")}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                {opt.color && <span className={`shrink-0 w-2 h-2 rounded-full ${opt.color}`} />}
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Native Select (Mobile)
  return (
    <NativeSelect
      className={className}
      size={size}
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <NativeSelectOption value="" disabled>
          {placeholder}
        </NativeSelectOption>
      )}
      {children}
    </NativeSelect>
  )
}
