import { ArrowLeft, Building2, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";

import type {
  OrganizationDetailSnapshot,
  OrganizationFullProfile,
} from "../../services/organizationControlCenterApi";
import { humanizeKey } from "./formatters";

interface OrgDetailsHeaderProps {
  profile?: OrganizationFullProfile;
  detail?: OrganizationDetailSnapshot;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function OrgDetailsHeader({
  profile,
  detail,
  isRefreshing,
  onRefresh,
}: OrgDetailsHeaderProps) {
  const name = profile?.name ?? detail?.name ?? "Organization";
  const logoUrl = profile?.logo_url ?? detail?.logo_url;
  const status = profile?.status ?? detail?.status;
  const orgType = profile?.org_type ?? detail?.org_type ?? profile?.structure_type;
  const domain = profile?.custom_domain?.domain;

  return (
    <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
      <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="h-16 w-16 shrink-0 rounded-2xl border border-border bg-white object-contain p-1.5 shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
              <Building2 className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {name}
              </h1>
              {status ? (
                <Badge variant={status === "active" ? "success" : "warning"}>
                  {humanizeKey(status)}
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {orgType ? <span>{humanizeKey(orgType)}</span> : null}
              {domain ? (
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
                >
                  {domain}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/superadmin/domains">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Custom domains
            </Link>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {isRefreshing ? "Refreshing" : "Refresh live data"}
          </Button>
        </div>
      </div>
    </header>
  );
}
