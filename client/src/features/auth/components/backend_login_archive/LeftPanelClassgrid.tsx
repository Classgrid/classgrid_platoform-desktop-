import { HelpCircle, Mail, MapPin, Shield } from "lucide-react";

/* ── Hardcoded Classgrid Constants ── */
const CLASSGRID_LOGO =
  "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png";

const CONTACT_EMAIL = "support@classgrid.in";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/classgridedu/",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    textColor: "text-[#E1306C]",
  },
  {
    label: "GitHub",
    href: "https://github.com/nikhilnick5050",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
    textColor: "text-[#333333]",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Classgrid/61588646851017/",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    textColor: "text-[#1877F2]",
  },
];

const SUPPORT_URL = "https://classgrid.in/support/ticket";

export function LeftPanelClassgrid() {
  return (
    <div className="relative flex h-full flex-col items-center justify-between py-12 px-10 overflow-hidden">
      {/* ── Dotted Pattern Background ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          WebkitMaskImage: "linear-gradient(to right, black 30%, transparent 90%)",
          maskImage: "linear-gradient(to right, black 30%, transparent 90%)",
        }}
        aria-hidden="true"
      />

      {/* ── Top-left Teal Glow ── */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-[#00E590] opacity-[0.12] blur-[130px]"
        aria-hidden="true"
      />

      {/* ── Bottom-right Orange Glow ── */}
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[550px] w-[550px] rounded-full bg-[#FF6B00] opacity-[0.15] blur-[140px]"
        aria-hidden="true"
      />

      {/* ── Top Spacing ── */}
      <div className="flex-1" />

      {/* ── Center Content ── */}
      <div className="flex flex-col items-center z-10">
        {/* Classgrid Logo */}
        <img
          src={CLASSGRID_LOGO}
          alt="Classgrid Logo"
          className="mb-10 h-[180px] w-[180px] object-contain drop-shadow-2xl"
          draggable={false}
        />

        {/* Contact Information */}
        <div className="w-full max-w-[340px]">
          <h3 className="mb-5 text-[20px] font-bold text-white">Contact Information</h3>

          <div className="flex items-center gap-4 pb-4">
            <Mail size={18} className="shrink-0 text-[#00E590]" />
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[14px] font-medium text-[#ededed] transition-colors hover:text-[#00E590]"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="mb-4 border-b border-white/[0.08]" />

          <div className="flex items-start gap-4">
            <MapPin size={18} className="mt-0.5 shrink-0 text-[#FF6B00]" />
            <div className="flex flex-col text-[13px] leading-relaxed text-[#d4d4d4]">
              <span>Sector 26, Pradhikaran, Nigdi,</span>
              <span>Pune, Maharashtra 411044</span>
            </div>
          </div>
        </div>

        {/* Social Media Card */}
        <div className="mt-8 flex h-[90px] w-full max-w-[340px] items-center justify-center gap-6 rounded-[18px] border border-white/[0.05] bg-[#121212]/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={`flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-300 hover:scale-110 ${link.textColor}`}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>

      {/* ── Bottom Spacing & Support Button ── */}
      <div className="flex-1 flex w-full items-end justify-start pb-2 z-10">
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-2.5 rounded-full border border-teal-700/60 bg-teal-950/40 px-5 py-2.5 text-[13px] font-medium text-teal-100 shadow-[0_0_15px_rgba(13,148,136,0.1)] backdrop-blur-md transition-all duration-300 hover:bg-teal-900/60 hover:text-white"
        >
          <HelpCircle size={16} className="text-[#00E590]" />
          Support
        </a>
      </div>
    </div>
  );
}
