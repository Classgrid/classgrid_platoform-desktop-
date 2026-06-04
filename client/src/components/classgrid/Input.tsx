import * as React from "react";

import { cn } from "@/lib/utils";

export interface CgInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const CgInput = React.forwardRef<HTMLInputElement, CgInputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn("cg-input", className)}
      {...props}
    />
  )
);

CgInput.displayName = "CgInput";

export { CgInput };
