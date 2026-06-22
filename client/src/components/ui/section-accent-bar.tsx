import type { HTMLAttributes } from "react";

type SectionAccentBarProps = HTMLAttributes<HTMLDivElement> & {
  align?: "left" | "center" | "right";
};

export function SectionAccentBar({
  align = "center",
  className = "",
  ...props
}: SectionAccentBarProps) {
  const alignClass =
    align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";

  return (
    <div
      aria-hidden="true"
      className={`${alignClass} mb-6 h-1.5 w-24 rounded-full bg-orange-500 ${className}`}
      {...props}
    />
  );
}
