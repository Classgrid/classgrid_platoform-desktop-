import { Badge } from "@/components/marketing_ui/badge";
import { Reveal } from "@/components/sections/Reveal";
import { SectionAccentBar } from "@/components/marketing_ui/section-accent-bar";
import { extractLocaleString, type SupportedLang } from "@/lib/locale";

type DocumentHeroProps = {
  badgeLabel?: any;
  badgeDotColor?: string;
  title: any;
  subtitles?: any[];
  description?: any;
  children?: React.ReactNode;
  lang?: SupportedLang;
  showAccentBar?: boolean;
};

export function DocumentHero({
  badgeLabel,
  badgeDotColor = "bg-emerald-500",
  title,
  subtitles = [],
  description,
  children,
  lang = "en",
  showAccentBar = true,
}: DocumentHeroProps) {
  return (
    <>
      {badgeLabel && (
        <Reveal distance={18}>
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${badgeDotColor}`} />
            {extractLocaleString(badgeLabel, lang)}
          </Badge>
        </Reveal>
      )}
      <Reveal delay={0.08} distance={22}>
        <div className="legal-hero-frame mt-4 w-full">
          <div className="mx-auto w-full max-w-[720px] px-4 py-4 text-center sm:px-6 sm:py-6">
            {showAccentBar ? <SectionAccentBar /> : null}
            <h1 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.05] tracking-tight text-foreground">
              {(extractLocaleString(title, lang) ?? "").replace(/\.\s*$/, "")}
            </h1>
            {subtitles.length > 0 && (
              <div className="mt-6 space-y-1.5 text-sm text-muted-foreground">
                {subtitles.map((sub, idx) => (
                  <p key={idx}>{extractLocaleString(sub, lang)}</p>
                ))}
              </div>
            )}
          </div>
        </div>
        {description && (
          <p className="mt-5 max-w-[720px] text-[0.95rem] leading-8 text-muted-foreground mx-auto">
            {extractLocaleString(description, lang)}
          </p>
        )}
        {children && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {children}
          </div>
        )}
      </Reveal>
    </>
  );
}
