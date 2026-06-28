import { Facebook, Github, HelpCircle, Instagram, Mail, MapPin, Youtube } from "lucide-react";

/* ── Hardcoded Classgrid Constants ── */
const CLASSGRID_LOGO =
  "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png";

const CONTACT_EMAIL = "support@classgrid.in";
const CONTACT_ADDRESS = "Sector 26, Pradhikaran, Nigdi, Pune, Maharashtra 411044";

const SOCIAL_LINKS = [
  { label: "Instagram", icon: Instagram, href: "https://www.instagram.com/classgridedu/" },
  { label: "YouTube", icon: Youtube, href: "https://www.youtube.com/channel/UCFC050N0V8PYjwaQ4Zbr7_A" },
  { label: "GitHub", icon: Github, href: "https://github.com/nikhilnick5050" },
  { label: "Facebook", icon: Facebook, href: "https://www.facebook.com/people/Classgrid/61588646851017/" },
];

const SUPPORT_URL = "https://classgrid.in/support/ticket";

/**
 * Left panel for FREE SUBDOMAIN logins (Variant 1 & 2).
 * Shows Classgrid logo, contact info, social card, and support button.
 * Includes subtle dotted pattern and glow-through.
 *
 * Design by Nikhil Shinde.
 */
export function LeftPanelClassgrid() {
  return (
    <div className="relative flex h-full flex-col items-center px-8 pt-28 pb-24">
      {/* ── Dotted Pattern Background ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />

      {/* ── Classgrid Logo ── */}
      <img
        src={CLASSGRID_LOGO}
        alt="Classgrid Logo"
        className="relative z-10 mb-12 h-[200px] w-[200px] object-contain drop-shadow-2xl"
        draggable={false}
      />

      {/* ── Contact Information ── */}
      <div className="relative z-10 w-full max-w-[420px]">
        <h3 className="mb-5 text-2xl font-bold text-white">Contact Information</h3>

        {/* Email */}
        <div className="flex items-center gap-3 pb-4">
          <Mail size={18} className="shrink-0 text-emerald-400" />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm text-[#ededed] transition-colors hover:text-emerald-400"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* Divider */}
        <div className="mb-4 border-b border-white/[0.14]" />

        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin size={18} className="mt-0.5 shrink-0 text-orange-400" />
          <span className="text-sm leading-relaxed text-[#ededed]">{CONTACT_ADDRESS}</span>
        </div>
      </div>

      {/* ── Social Media Card ── */}
      <div className="relative z-10 mt-8 flex h-[120px] w-full max-w-[440px] items-center justify-center gap-6 rounded-[22px] border border-white/[0.14] bg-white/[0.04] backdrop-blur-md">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-lg"
          >
            <link.icon size={20} />
          </a>
        ))}
      </div>

      {/* ── Support Button (bottom-left, absolute) ── */}
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-8 left-8 z-10 flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-emerald-600 hover:shadow-xl"
      >
        <HelpCircle size={16} />
        Support
      </a>
    </div>
  );
}
