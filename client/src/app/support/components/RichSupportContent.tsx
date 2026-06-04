type RichSupportContentProps = {
  html?: string;
  className?: string;
};

export function RichSupportContent({ html = "", className = "" }: RichSupportContentProps) {
  return (
    <div
      className={`cg-rich-support-content [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-emerald-700 dark:hover:[&_a]:text-emerald-300 ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function getPlainTextFromHtml(html?: string) {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || el.innerText || "").replace(/\s+/g, " ").trim();
}
