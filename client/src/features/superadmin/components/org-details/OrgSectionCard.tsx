import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/marketing_ui/card";

interface OrgSectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function OrgSectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: OrgSectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="border-b border-border/60">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <CardTitle className="text-base">{title}</CardTitle>
              {description ? (
                <CardDescription className="mt-1.5 leading-relaxed">
                  {description}
                </CardDescription>
              ) : null}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}
