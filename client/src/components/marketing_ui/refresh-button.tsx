import React from "react";
import { RefreshCw } from "lucide-react";
import { Button, ButtonProps } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { cn } from "@/lib/utils";

export interface RefreshButtonProps extends Omit<ButtonProps, "children"> {
  isFetching?: boolean;
  label?: React.ReactNode;
}

export function RefreshButton({
  isFetching = false,
  label = "Refresh",
  className,
  disabled,
  ...props
}: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      disabled={isFetching || disabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {isFetching ? (
        <Spinner className="w-4 h-4" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      {label && <span>{label}</span>}
    </Button>
  );
}
