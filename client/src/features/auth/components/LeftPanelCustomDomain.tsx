import {
  Facebook,
  Github,
  Globe,
  HelpCircle,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";

import type { AuthBranding } from "../types";

const SUPPORT_URL = "https://classgrid.in/support/ticket";

const PLATFORM_ICON_MAP: Record<string, typeof Instagram> = {
  instagram_url: Instagram,
  youtube_url: Youtube,
  facebook_url: Facebook,
  linkedin_url: Linkedin,
  twitter_url: Twitter,
  github_url: Github,
  website_url: Globe,
};

type LeftPanelCustomDomainProps = {
  branding: AuthBranding;
};

/**
 * Left panel for CUSTOM DOMAIN logins (Variant 4).
 * Shows the org's campus photo as a full-bleed background,
 * with "Welcome" text overlay and the org's social links.
 * Classgrid branding is completely removed.
 *
 * Design by Nikhil Shinde.
 */
export function LeftPanelCustomDomain({ branding }: LeftPanelCustomDomainProps) {
  const socialEntries = branding.socialLinks
    ? Object.entries(branding.socialLinks).filter(
        ([, url]) => typeof url === "string" && url.trim().length > 0
      )
    : [];

  const hasCampusImage = !!branding.campusImageUrl;

  return (
    <div className="relative flex h-full flex-col">
      {/* ── Campus Photo (full bleed) ── */}
      {hasCampusImage ? (
        <img
          src={branding.campusImageUrl}
          alt={`${branding.name} Campus`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        /* Fallback gradient if no campus photo */
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #111111 0%, #1a2e1a 40%, #0f2318 70%, #111111 100%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Dark gradient overlay at bottom for readability ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* ── Bottom Content (over the photo) ── */}
      <div className="relative z-10 mt-auto px-8 pb-24">
        {/* Welcome Text */}
        <h2 className="mb-2 text-4xl font-bold text-white drop-shadow-lg">Welcome</h2>
        <p className="mb-6 text-sm text-white/70">
          Sign in to access your {branding.shortName || branding.name} portal
        </p>

        {/* Social Links (if org has any) */}
        {socialEntries.length > 0 && (
          <div className="flex items-center gap-4">
            {socialEntries.map(([key, url]) => {
              const IconComponent = PLATFORM_ICON_MAP[key] || Globe;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={key.replace("_url", "")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white/30"
                >
                  <IconComponent size={18} />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Support Button (bottom-left, absolute) ── */}
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-8 left-8 z-10 flex items-center gap-2 rounded-full bg-emerald-700/80 px-6 py-3.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-xl"
      >
        <HelpCircle size={16} />
        Support
      </a>
    </div>
  );
}
