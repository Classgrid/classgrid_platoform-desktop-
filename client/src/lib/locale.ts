/**
 * Single source of truth for locale helpers.
 *
 * RULE: Slugs are always plain English strings.
 * Only content fields are localized.
 * Language is selected via ?lang=hi or ?lang=mr, never via URL path.
 */

export const SUPPORTED_LANGS = ['en', 'hi', 'mr'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

export type LocaleRecord<T> = Partial<Record<SupportedLang, T>>;
export type LocalizedValue<T> = T | LocaleRecord<T> | null | undefined;

export const LANG_LABELS: Record<SupportedLang, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
};

export function isSupportedLang(value: unknown): value is SupportedLang {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function normalizeLang(value: unknown): SupportedLang {
  return isSupportedLang(value) ? value : 'en';
}

function isLocaleRecord<T>(value: unknown): value is LocaleRecord<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return 'en' in value || 'hi' in value || 'mr' in value;
}

export function extractLocaleValue<T>(
  value: LocalizedValue<T>,
  lang: SupportedLang = 'en',
  fallback?: T
): T | undefined {
  if (value == null) return fallback;
  if (isLocaleRecord<T>(value)) {
    return value[lang] ?? value.en ?? value.hi ?? value.mr ?? fallback;
  }
  return value;
}

export function extractLocaleString(
  value: unknown,
  lang: SupportedLang = 'en',
  fallback = ''
): string {
  if (typeof value === 'string') return value || fallback;
  const localized = extractLocaleValue<string>(value as LocalizedValue<string>, lang);
  return typeof localized === 'string' ? localized || fallback : fallback;
}

export function parseLang(
  searchParams: Record<string, string | string[] | undefined> | undefined
): SupportedLang {
  const raw = Array.isArray(searchParams?.lang) ? searchParams?.lang[0] : searchParams?.lang;
  return normalizeLang(raw);
}

export function buildLangHref(href: string, lang: SupportedLang = 'en'): string {
  if (!href || lang === 'en' || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
    return href;
  }

  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const pathWithQuery = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = pathWithQuery.indexOf('?');
  const pathname = queryIndex >= 0 ? pathWithQuery.slice(0, queryIndex) : pathWithQuery;
  const query = queryIndex >= 0 ? pathWithQuery.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(query);

  params.set('lang', lang);
  const nextQuery = params.toString();

  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash}`;
}
