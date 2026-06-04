import * as React from "react";
import { Loader2 } from "lucide-react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import "./Button.css";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        className: "border-2",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

const CgButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    isLoading, 
    leftIcon, 
    rightIcon, 
    loadingText,
    children, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "relative overflow-hidden")}
        ref={ref}
        disabled={props.disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className={cn("h-4 w-4 animate-spin", loadingText ? "mr-2" : "")} /> : null}
        {isLoading ? (
          <Slottable>
            {loadingText ? <span>{loadingText}</span> : <span className="opacity-0">{children}</span>}
          </Slottable>
        ) : null}
        {!isLoading && leftIcon ? <span className="mr-2 inline-flex">{leftIcon}</span> : null}
        {!isLoading ? <Slottable>{children}</Slottable> : null}
        {!isLoading && rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
      </Comp>
    );
  }
);
CgButton.displayName = "CgButton";

export { CgButton, CgButton as Button, buttonVariants };
