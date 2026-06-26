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
    const opts: { value: string; label: React.ReactNode }[] = []
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === "option") {
        opts.push({
          value: String(child.props.value || child.props.children),
          label: child.props.children,
        })
      }
    })
    return opts
  }, [children])

  // Custom Select (Desktop)
  if (isDesktop) {
    // Find the currently selected label for the value placeholder
    const selectedOption = options.find((opt) => opt.value === String(value))
    
    return (
      <Select
        value={value !== undefined ? String(value) : undefined}
        onValueChange={(val) => {
          if (onChange) {
            // Mock a synthetic event for drop-in compatibility
            const event = {
              target: { value: val },
              currentTarget: { value: val },
              preventDefault: () => {},
              stopPropagation: () => {},
            } as any
            onChange(event)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className={className} size={size}>
          <SelectValue placeholder={placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
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
