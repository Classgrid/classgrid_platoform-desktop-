import React from "react";
import { Building2, Globe, Phone, MapPin } from "lucide-react";
import { ProfileData } from "../../queries/useUserProfile";

type ProfileOrganizationCardProps = {
  org: ProfileData["organization_id"];
};

export function ProfileOrganizationCard({ org }: ProfileOrganizationCardProps) {
  if (!org) return null;

  return (
    <div className="cg-bento-card">
      <div className="cg-bento-header">
        <h3 className="cg-bento-title"><Building2 size={18} /> Organization Details</h3>
        <p className="cg-bento-desc">Institution you are affiliated with.</p>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-md object-contain bg-white border border-border" />
          ) : (
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border border-border">
              <Building2 size={24} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <h4 className="font-semibold">{org.name}</h4>
            {org.affiliation && <p className="text-xs text-muted-foreground">{org.affiliation}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2 text-sm text-muted-foreground">
          {org.website && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-primary" />
              <a href={org.website} target="_blank" rel="noreferrer" className="hover:underline">{org.website}</a>
            </div>
          )}
          {org.contactNumber && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-primary" />
              <span>{org.contactNumber}</span>
            </div>
          )}
          {org.address && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
              <span className="leading-snug">{org.address}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
