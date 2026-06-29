import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, FileText, Globe2, Pencil, Send, X } from "lucide-react";

import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import CMSPageEditor from "@/features/website_cms/components/CMSPageEditor";

type CMSMode = "view" | "edit";

type CMSPageRecord = {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  updatedAt: string;
  html: string;
};

const INITIAL_PAGES: CMSPageRecord[] = [
  {
    id: "home",
    title: "Home",
    slug: "/",
    status: "published",
    updatedAt: "Today, 10:30 AM",
    html: "<h2>Welcome to your college website</h2><p>This homepage introduces the institution, highlights admissions, and gives visitors a clear path to explore programs, notices, and campus life.</p><ul><li>Hero announcement and admission callout</li><li>Featured programs and campus highlights</li><li>Quick links for students and parents</li></ul>",
  },
  {
    id: "about",
    title: "About Us",
    slug: "/about",
    status: "published",
    updatedAt: "Yesterday, 4:15 PM",
    html: "<h2>About the institution</h2><p>Use this page to share the college history, mission, leadership message, accreditation details, and the values that shape the student experience.</p>",
  },
  {
    id: "admissions",
    title: "Admissions",
    slug: "/admissions",
    status: "draft",
    updatedAt: "Jun 28, 2026",
    html: "<h2>Admissions information</h2><p>Publish eligibility criteria, application timelines, required documents, fee payment guidance, and contact details for the admissions office.</p>",
  },
  {
    id: "facilities",
    title: "Facilities",
    slug: "/facilities",
    status: "published",
    updatedAt: "Jun 27, 2026",
    html: "<h2>Campus facilities</h2><p>Showcase classrooms, laboratories, library resources, sports areas, hostel services, transport, and student support spaces.</p>",
  },
  {
    id: "contact",
    title: "Contact",
    slug: "/contact",
    status: "published",
    updatedAt: "Jun 26, 2026",
    html: "<h2>Contact the college</h2><p>Add office hours, phone numbers, email addresses, map details, and enquiry instructions for visitors.</p>",
  },
];

const DEFAULT_PAGE = INITIAL_PAGES[0]!;

export function WebsiteCMSPage() {
  const location = useLocation();
  const [pages, setPages] = useState<CMSPageRecord[]>(INITIAL_PAGES);
  const [activePageId, setActivePageId] = useState(DEFAULT_PAGE.id);
  const [mode, setMode] = useState<CMSMode>("view");
  const [draftHtml, setDraftHtml] = useState(DEFAULT_PAGE.html);

  const activePage = pages.find((page) => page.id === activePageId) ?? DEFAULT_PAGE;
  const isEditing = mode === "edit";

  const selectPage = (pageId: string) => {
    const nextPage = pages.find((page) => page.id === pageId);
    if (!nextPage) return;
    setActivePageId(pageId);
    setDraftHtml(nextPage.html);
    setMode("view");
  };

  const startEditing = () => {
    setDraftHtml(activePage.html);
    setMode("edit");
  };

  const cancelEditing = () => {
    setDraftHtml(activePage.html);
    setMode("view");
  };

  const publishDraft = () => {
    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === activePage.id
          ? {
              ...page,
              html: draftHtml,
              status: "published",
              updatedAt: "Just now",
            }
          : page
      )
    );
    setMode("view");
  };

  return (
    <div className="flex w-full max-w-[1600px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Globe2 className="h-4 w-4" /> Website CMS
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">College Website Content</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Manage public website pages from one split-screen workspace. Current route: {location.pathname}
          </p>
        </div>
        <Badge variant={isEditing ? "warning" : "success"} className="w-fit">
          {isEditing ? "Editing draft" : "View mode"}
        </Badge>
      </header>

      <section className="grid min-h-[680px] grid-cols-1 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pages</h2>
              <Badge variant="neutral">{pages.length}</Badge>
            </div>
          </div>
          <nav className="flex flex-col p-2" aria-label="Website pages">
            {pages.map((page) => {
              const isActive = page.id === activePage.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => selectPage(page.id)}
                  className={`flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }`}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{page.title}</span>
                    <span className="mt-1 block truncate text-xs">{page.slug}</span>
                  </span>
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      page.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-col bg-background">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold text-foreground">{activePage.title}</h2>
                <Badge variant={activePage.status === "published" ? "success" : "warning"}>
                  {activePage.status}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{activePage.slug}</span>
                <span>Updated {activePage.updatedAt}</span>
              </div>
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={publishDraft}>
                  <Send className="h-4 w-4" /> Publish
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4" /> Edit Page
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                <Pencil className="h-4 w-4" /> Editing local draft content. Database publishing comes in Part 2.
              </div>
              <CMSPageEditor
                key={activePage.id}
                initialHTML={draftHtml}
                minHeight={420}
                onChange={setDraftHtml}
                placeholder="Write this page content..."
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-5 p-5">
              <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Page preview
                </div>
                <p className="mt-1">This is a static Part 1 preview. It will load and save MongoDB content in Part 2.</p>
              </div>
              <article
                className="prose prose-sm max-w-none rounded-md border border-border bg-background p-5 text-foreground dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: activePage.html }}
              />
            </div>
          )}
        </main>
      </section>
    </div>
  );
}