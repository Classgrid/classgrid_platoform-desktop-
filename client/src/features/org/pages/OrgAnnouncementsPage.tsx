import type { ReactNode } from "react";
import { useState } from "react";
import {
  Loader2,
  Megaphone,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import {
  getPrimaryHierarchyLevel,
  getProfileTermPlural,
} from "../components/dashboardProfileUtils";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";
import {
  type CreateOrgAnnouncementPayload,
  type OrgAnnouncement,
  type OrgAnnouncementStatus,
  type OrgAnnouncementTargetType,
  type OrgAnnouncementType,
  useCreateOrgAnnouncement,
  useOrgAnnouncementClassrooms,
  useOrgAnnouncements,
} from "../queries/useOrgAnnouncements";

type AudienceSelection = {
  learner: boolean;
  educator: boolean;
};

const announcementTypes: OrgAnnouncementType[] = [
  "announcement",
  "notice",
  "event",
  "holiday",
  "emergency",
];

const announcementStatuses: OrgAnnouncementStatus[] = ["published", "draft", "scheduled"];

export function OrgAnnouncementsPage() {
  const { data: profile, isLoading: isProfileLoading } = useInstitutionProfile();
  const announcementsQuery = useOrgAnnouncements();
  const classroomsQuery = useOrgAnnouncementClassrooms();
  const createAnnouncement = useCreateOrgAnnouncement();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<OrgAnnouncementType>("announcement");
  const [status, setStatus] = useState<OrgAnnouncementStatus>("published");
  const [targetType, setTargetType] = useState<OrgAnnouncementTargetType>("all");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [audience, setAudience] = useState<AudienceSelection>({ learner: true, educator: true });
  const [formError, setFormError] = useState("");

  if (isProfileLoading || !profile) {
    return <div className="h-96 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  const targetLevel = getPrimaryHierarchyLevel(profile);
  const targetLevelLabel = profile.levelLabels[targetLevel] ?? profile.terminology.program ?? "Target";
  const learnerAudienceLabel = getProfileTermPlural(profile, "learner");
  const educatorAudienceLabel = getProfileTermPlural(profile, "educator");
  const announcements = announcementsQuery.data?.announcements ?? [];
  const classrooms = classroomsQuery.data ?? [];
  const filteredAnnouncements = announcements.filter((announcement) =>
    [announcement.title, announcement.content, announcement.type, announcement.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function resetForm() {
    setTitle("");
    setContent("");
    setType("announcement");
    setStatus("published");
    setTargetType("all");
    setSelectedTargets([]);
    setAudience({ learner: true, educator: true });
    setFormError("");
  }

  function toggleAudience(key: keyof AudienceSelection) {
    setAudience((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleTarget(targetId: string) {
    setSelectedTargets((current) =>
      current.includes(targetId)
        ? current.filter((id) => id !== targetId)
        : [...current, targetId],
    );
  }

  function handleOpenModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function handleCreateAnnouncement() {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      setFormError("Title and message are required.");
      return;
    }

    if (!audience.learner && !audience.educator) {
      setFormError("Select at least one audience.");
      return;
    }

    if (targetType === "specific" && selectedTargets.length === 0) {
      setFormError(`Select at least one ${targetLevelLabel}.`);
      return;
    }

    const payload: CreateOrgAnnouncementPayload = {
      title: cleanTitle,
      content: cleanContent,
      type,
      status,
      target_type: targetType,
      target_classrooms: targetType === "specific" ? selectedTargets : undefined,
    };

    createAnnouncement.mutate(payload, {
      onSuccess: () => {
        handleCloseModal();
      },
      onError: (error) => {
        setFormError(getErrorMessage(error));
      },
    });
  }

  return (
    <main className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Org Admin Overview</p>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Broadcast updates to {learnerAudienceLabel}, {educatorAudienceLabel}, or a selected {targetLevelLabel}.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          onClick={handleOpenModal}
        >
          <Plus className="h-4 w-4" />
          Create New
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Total" value={String(announcementsQuery.data?.pagination.total ?? announcements.length)} />
        <SummaryCard label="Published" value={String(announcements.filter((item) => item.status === "published").length)} />
        <SummaryCard label={`Target by ${targetLevelLabel}`} value={String(announcements.filter((item) => item.target_type === "specific").length)} />
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Announcement List</h2>
            <p className="text-sm text-muted-foreground">Fetched from the organization announcement backend.</p>
          </div>
          <label className="relative w-full md:w-80">
            <span className="sr-only">Search announcements</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search announcements..."
            />
          </label>
        </div>

        {announcementsQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading announcements
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <Megaphone className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">No announcements found</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a broadcast when your org has an update.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementRow
                key={announcement._id}
                announcement={announcement}
                targetLevelLabel={targetLevelLabel}
              />
            ))}
          </div>
        )}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <section
            aria-modal="true"
            role="dialog"
            aria-labelledby="create-announcement-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 id="create-announcement-title" className="text-lg font-semibold text-foreground">
                  Create New Announcement
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Uses the active institution profile for labels and targeting.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <Field label="Title">
                <input
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Write a clear announcement title"
                />
              </Field>

              <Field label="Message">
                <textarea
                  className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write the update that should reach the selected audience"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Type">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={type}
                    onChange={(event) => setType(event.target.value as OrgAnnouncementType)}
                  >
                    {announcementTypes.map((item) => (
                      <option key={item} value={item}>
                        {titleCase(item)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as OrgAnnouncementStatus)}
                  >
                    {announcementStatuses.map((item) => (
                      <option key={item} value={item}>
                        {titleCase(item)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Audience">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <AudienceCheckbox
                    checked={audience.learner}
                    label={learnerAudienceLabel}
                    onChange={() => toggleAudience("learner")}
                  />
                  <AudienceCheckbox
                    checked={audience.educator}
                    label={educatorAudienceLabel}
                    onChange={() => toggleAudience("educator")}
                  />
                </div>
              </Field>

              <Field label="Target">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={targetType}
                  onChange={(event) => {
                    setTargetType(event.target.value as OrgAnnouncementTargetType);
                    setSelectedTargets([]);
                  }}
                >
                  <option value="all">Send to all selected audiences</option>
                  <option value="specific">Send to {targetLevelLabel}</option>
                </select>
              </Field>

              {targetType === "specific" ? (
                <Field label={`Select ${targetLevelLabel}`}>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                    {classroomsQuery.isLoading ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading targets
                      </div>
                    ) : classrooms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No target records found from the backend yet.</p>
                    ) : (
                      classrooms.map((classroom) => (
                        <TargetCheckbox
                          key={classroom._id}
                          checked={selectedTargets.includes(classroom._id)}
                          label={classroom.name ?? classroom.subject ?? classroom._id}
                          meta={classroom.facultyName}
                          onChange={() => toggleTarget(classroom._id)}
                        />
                      ))
                    )}
                  </div>
                </Field>
              ) : null}

              {formError ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border p-5">
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCreateAnnouncement}
                disabled={createAnnouncement.isPending}
              >
                {createAnnouncement.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function AudienceCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={onChange} />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}

function TargetCheckbox({
  checked,
  label,
  meta,
  onChange,
}: {
  checked: boolean;
  label: string;
  meta?: string;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
      <span className="flex items-center gap-3">
        <input type="checkbox" className="h-4 w-4" checked={checked} onChange={onChange} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </span>
      {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
    </label>
  );
}

function AnnouncementRow({
  announcement,
  targetLevelLabel,
}: {
  announcement: OrgAnnouncement;
  targetLevelLabel: string;
}) {
  const createdAt = announcement.createdAt ?? announcement.created_at;
  const targets = announcement.target_classrooms ?? [];
  const targetLabel =
    announcement.target_type === "all"
      ? "All selected audiences"
      : `${targetLevelLabel}: ${targets.length > 0 ? targets.map((target) => target.name ?? target._id).join(", ") : "Selected targets"}`;

  return (
    <article className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1fr_220px_130px] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">{announcement.title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {titleCase(announcement.type)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{toPlainText(announcement.content)}</p>
        <p className="mt-2 text-xs text-muted-foreground">{targetLabel}</p>
      </div>
      <div className="text-sm text-muted-foreground">
        {createdAt ? new Date(createdAt).toLocaleString() : "Not sent yet"}
      </div>
      <span className="w-fit rounded-full border border-border px-3 py-1 text-xs font-medium capitalize text-foreground">
        {announcement.status}
      </span>
    </article>
  );
}

function titleCase(value: string) {
  return value
    .replace("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toPlainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Failed to create announcement.";
}
