// @ts-nocheck
"use client";

import React, { type ComponentPropsWithoutRef, type ReactNode, useRef, useState } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

import { IconRenderer } from "./icon-renderer";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon: React.ElementType | string;
  description: string;
  href: string;
  cta: string;
  color?: string;
  iconColor?: string;
  tag?: string;
  tagVariant?: "emerald" | "cyan" | "amber" | "rose" | "violet" | "blue" | "orange" | "default";
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[220px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  color = "from-emerald-400/20",
  iconColor = "#34d399",
  tag,
  tagVariant = "emerald",
  ...props
}: BentoCardProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the mouse movement
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const showCta = Boolean(cta?.trim() && href?.trim());

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border transition-all duration-300",
        "bg-card border-black/20 shadow-sm dark:shadow-none dark:border-white/20",
        "hover:-translate-y-[6px] hover:shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)] hover:border-primary/30",
        className
      )}
      {...(props as any)}
    >
      {/* Background Glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${springX}px ${springY}px,
              rgba(16, 185, 129, 0.05),
              transparent 80%
            )
          `,
        }}
      />
      
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 hidden dark:block"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${springX}px ${springY}px,
              rgba(16, 185, 129, 0.15),
              transparent 80%
            )
          `,
        }}
      />

      {/* Hover border glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              300px circle at ${springX}px ${springY}px,
              ${iconColor}66,
              transparent 80%
            )
          `,
          WebkitMaskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-10 pointer-events-none -z-10", color)} />
      {background && <div className="absolute inset-0 opacity-10 pointer-events-none -z-10">{background}</div>}

      <div className="p-6 relative z-20 flex flex-col h-full bg-transparent">
        <div className="flex transform-gpu flex-col gap-2 transition-all duration-300 lg:group-hover:-translate-y-2">
          <div className="flex h-10 w-10 items-center justify-center mb-1" style={{ color: iconColor, filter: `drop-shadow(0 0 6px ${iconColor}99)` }}>
            {typeof Icon === "string" ? <IconRenderer name={Icon} className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              {name}
            </h3>
            {tag?.trim() ? (
              <Chip variant={tagVariant} className="text-[10px]">
                {tag}
              </Chip>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed font-medium">{description}</p>
        </div>

        {showCta ? (
          <div className="mt-auto pt-4 flex w-full flex-row items-center transition-all duration-300 lg:hidden">
            <Button variant="link" size="sm" className="pointer-events-auto p-0 text-emerald-400 hover:text-emerald-300" asChild>
              <a href={href}>{cta}<ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" /></a>
            </Button>
          </div>
        ) : null}

        {showCta ? (
          <div className="absolute bottom-6 hidden w-[calc(100%-3rem)] translate-y-10 transform-gpu flex-row items-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
            <Button variant="link" size="sm" className="pointer-events-auto p-0 text-emerald-400 hover:text-emerald-300" asChild>
              <a href={href}>{cta}<ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" /></a>
            </Button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

export { BentoCard, BentoGrid };
