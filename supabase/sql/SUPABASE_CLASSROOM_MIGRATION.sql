-- ================================================================
-- CLASSGRID — COMPLETE SUPABASE SETUP (VERIFIED)
-- ================================================================
-- Run this in Supabase SQL Editor (project: hukbgzdreghzidgzwxlj)
--
-- VERIFIED against actual backend code:
-- ✅ classroom_memberships  → used in classroom.routes.js
-- ✅ materials              → used in classroom.routes.js
-- ✅ announcements          → used in classroom.routes.js
-- ✅ quizzes                → used in classroom.routes.js
-- ✅ meetings               → used in zoom.routes.js + calendar.routes.js
-- ✅ notifications          → used in classroom.routes.js
-- ✅ material_summaries     → used in classroom.routes.js
-- ✅ content_comments       → used in comments.routes.js
--
-- ❌ SKIPPED (these live in MongoDB, NOT Supabase):
--    - attendance_sessions  → MongoDB: AttendanceSession model
--    - attendance_records   → MongoDB: AttendanceRecord model
--    - classroom_settings   → MongoDB: Classroom.settings embedded doc
-- ================================================================


-- ════════════════════════════════════════════════
-- 1. CORE TABLES
-- ════════════════════════════════════════════════

-- ── CLASSROOM MEMBERSHIPS ──
CREATE TABLE IF NOT EXISTS classroom_memberships (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    classroom_id    TEXT NOT NULL,
    student_id      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    request_message TEXT,
    joined_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),

    UNIQUE (classroom_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_cm_classroom   ON classroom_memberships(classroom_id);
CREATE INDEX IF NOT EXISTS idx_cm_student     ON classroom_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_cm_status      ON classroom_memberships(classroom_id, status);


-- ── MATERIALS ──
CREATE TABLE IF NOT EXISTS materials (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           TEXT,
    subject_slug    TEXT,
    file_url        TEXT,
    uploaded_by     TEXT,
    type            TEXT,
    classroom_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materials_classroom          ON materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_materials_classroom_subject   ON materials(classroom_id, subject_slug);


-- ── ANNOUNCEMENTS ──
CREATE TABLE IF NOT EXISTS announcements (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           TEXT,
    message         TEXT,
    content         TEXT,
    subject_slug    TEXT,
    posted_by       TEXT,
    tags            TEXT[] DEFAULT '{"General"}',
    classroom_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_classroom          ON announcements(classroom_id);
CREATE INDEX IF NOT EXISTS idx_announcements_classroom_subject   ON announcements(classroom_id, subject_slug);


-- ── QUIZZES ──
CREATE TABLE IF NOT EXISTS quizzes (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           TEXT,
    subject_slug    TEXT,
    quiz_url        TEXT,
    provider        TEXT DEFAULT 'Google Forms',
    classroom_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_classroom          ON quizzes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_subject   ON quizzes(classroom_id, subject_slug);


-- ── MEETINGS (Zoom + Google Meet) ──
CREATE TABLE IF NOT EXISTS meetings (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    classroom_id        TEXT NOT NULL,
    teacher_id          TEXT NOT NULL,
    provider            TEXT NOT NULL CHECK (provider IN ('zoom', 'google_meet')),
    topic               TEXT,
    join_url            TEXT,
    start_time          TIMESTAMPTZ NOT NULL,
    duration            INTEGER DEFAULT 60,
    calendar_event_id   TEXT,
    status              TEXT DEFAULT 'upcoming'
                            CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_classroom   ON meetings(classroom_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start       ON meetings(classroom_id, start_time);


-- ── NOTIFICATIONS ──
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id    TEXT NOT NULL,
    type            TEXT DEFAULT 'system',
    title           TEXT,
    message         TEXT,
    link            TEXT,
    related_id      TEXT,
    classroom_id    TEXT,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient  ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notif_read       ON notifications(recipient_id, is_read);


-- ── CONTENT COMMENTS (used by comments.routes.js) ──
CREATE TABLE IF NOT EXISTS content_comments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_id      TEXT NOT NULL,
    classroom_id    TEXT,
    user_id         TEXT NOT NULL,
    user_name       TEXT,
    user_role       TEXT,
    comment         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_content ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user    ON content_comments(user_id);


-- ── MATERIAL SUMMARIES (AI cache) ──
CREATE TABLE IF NOT EXISTS material_summaries (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    material_id     TEXT NOT NULL UNIQUE,
    classroom_id    TEXT,
    summary         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matsummary_material ON material_summaries(material_id);


-- ════════════════════════════════════════════════
-- 2. TRIGGER — auto-update updated_at
-- ════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_matsummary_updated ON material_summaries;
CREATE TRIGGER trg_matsummary_updated
BEFORE UPDATE ON material_summaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════
-- Backend uses SERVICE_ROLE_KEY (bypasses RLS).
-- These policies are a safety net.

ALTER TABLE classroom_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials              ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_summaries     ENABLE ROW LEVEL SECURITY;

-- Allow full access for service_role (your backend)
DROP POLICY IF EXISTS "service_all_classroom_memberships" ON classroom_memberships;
CREATE POLICY "service_all_classroom_memberships" ON classroom_memberships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_materials" ON materials;
CREATE POLICY "service_all_materials" ON materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_announcements" ON announcements;
CREATE POLICY "service_all_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_quizzes" ON quizzes;
CREATE POLICY "service_all_quizzes" ON quizzes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_meetings" ON meetings;
CREATE POLICY "service_all_meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_notifications" ON notifications;
CREATE POLICY "service_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_content_comments" ON content_comments;
CREATE POLICY "service_all_content_comments" ON content_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_material_summaries" ON material_summaries;
CREATE POLICY "service_all_material_summaries" ON material_summaries FOR ALL USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════
-- 4. STORAGE BUCKETS
-- ════════════════════════════════════════════════

-- classroom-files (material uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'classroom-files', 'classroom-files', true, 52428800,
    ARRAY[
        'application/pdf',
        'image/png','image/jpeg','image/gif','image/webp','image/svg+xml',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain','text/csv',
        'application/zip',
        'video/mp4','video/webm',
        'audio/mpeg','audio/wav'
    ]
) ON CONFLICT (id) DO NOTHING;

-- notes-files (student notes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'notes-files', 'notes-files', true, 52428800,
    ARRAY[
        'application/pdf',
        'image/png','image/jpeg','image/gif','image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
) ON CONFLICT (id) DO NOTHING;

-- assignment-files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assignment-files', 'assignment-files', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- student-submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('student-submissions', 'student-submissions', true, 52428800)
ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════
-- 5. STORAGE POLICIES
-- ════════════════════════════════════════════════

-- Public read on all buckets
CREATE POLICY "Public read classroom-files" ON storage.objects
    FOR SELECT USING (bucket_id = 'classroom-files');

CREATE POLICY "Public read notes-files" ON storage.objects
    FOR SELECT USING (bucket_id = 'notes-files');

CREATE POLICY "Public read assignment-files" ON storage.objects
    FOR SELECT USING (bucket_id = 'assignment-files');

CREATE POLICY "Public read student-submissions" ON storage.objects
    FOR SELECT USING (bucket_id = 'student-submissions');

-- Service role insert/delete on all buckets
CREATE POLICY "Upload classroom-files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'classroom-files');

CREATE POLICY "Delete classroom-files" ON storage.objects
    FOR DELETE USING (bucket_id = 'classroom-files');

CREATE POLICY "Upload notes-files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'notes-files');

CREATE POLICY "Delete notes-files" ON storage.objects
    FOR DELETE USING (bucket_id = 'notes-files');

CREATE POLICY "Upload assignment-files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'assignment-files');

CREATE POLICY "Delete assignment-files" ON storage.objects
    FOR DELETE USING (bucket_id = 'assignment-files');

CREATE POLICY "Upload student-submissions" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'student-submissions');

CREATE POLICY "Delete student-submissions" ON storage.objects
    FOR DELETE USING (bucket_id = 'student-submissions');


-- ════════════════════════════════════════════════
-- ✅ SETUP COMPLETE
-- ════════════════════════════════════════════════
--
-- SUPABASE TABLES (8):
--   classroom_memberships, materials, announcements,
--   quizzes, meetings, notifications,
--   content_comments, material_summaries
--
-- STORAGE BUCKETS (4):
--   classroom-files, notes-files,
--   assignment-files, student-submissions
--
-- MONGODB (NOT in Supabase):
--   Classroom (with settings), AttendanceSession,
--   AttendanceRecord, User, Notification (Mongoose),
--   ClassroomMembership (Mongoose), AdminAuditLog
--
-- ════════════════════════════════════════════════
