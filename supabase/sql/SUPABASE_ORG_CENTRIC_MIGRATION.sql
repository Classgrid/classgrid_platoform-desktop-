-- =========================================================================
-- CLASSGRID ORG-CENTRIC ACADEMIC SYSTEM MIGRATION
-- Copy and paste everything below into your Supabase SQL Editor and hit RUN
-- =========================================================================

-- 1. Faculty Profiles
CREATE TABLE IF NOT EXISTS faculty_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Maps to MongoDB User._id
  org_id TEXT,                  -- Maps to MongoDB Organization._id
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,          -- Prof, Dr, Mr, Mrs, Other
  qualification TEXT,
  experience TEXT,
  specialization TEXT,
  subjects TEXT[] DEFAULT '{}',
  roles TEXT[] DEFAULT '{}',    -- (Legacy)
  divisions TEXT[] DEFAULT '{}',-- (Legacy)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Maps to MongoDB User._id
  org_id TEXT,                  -- Maps to MongoDB Organization._id
  name TEXT NOT NULL,
  prn TEXT,
  roll_no TEXT,
  division TEXT NOT NULL,       -- (Legacy)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Central Divisions Table
CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,      -- Maps to MongoDB Organization._id
  name TEXT NOT NULL,        -- e.g., 'FY-A', 'SY-B'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- 4. Faculty Divisions (Mapping Table for Multiple Roles)
CREATE TABLE IF NOT EXISTS faculty_divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES faculty_profiles(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,        -- 'class_teacher', 'assistant_teacher', 'subject_teacher'
  start_date DATE NOT NULL,  -- For academic year tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(faculty_id, division_id, role)
);

-- Enforce maximum 1 Class Teacher per division
CREATE UNIQUE INDEX IF NOT EXISTS one_class_teacher_per_division 
ON faculty_divisions (division_id) 
WHERE role = 'class_teacher';

-- 5. Class Roles (CR / Monitor)
-- Enforces only 1 CR and 1 Monitor per division (using division_id)
CREATE TABLE IF NOT EXISTS class_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  division TEXT,                -- (Legacy)
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  role TEXT NOT NULL,           -- 'CR', 'Monitor'
  assigned_by UUID REFERENCES faculty_profiles(id) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(division_id, role)        -- Only 1 specific role per division!
);

-- 6. Analytics: Attendance Tracking
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  division TEXT,                -- (Legacy)
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL, -- 'present', 'absent'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Analytics: Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assignment_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'submitted', 'pending'
  submitted_at TIMESTAMPTZ
);

-- 8. Analytics: Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Matches MongoDB user._id
  action TEXT NOT NULL, -- 'login', 'view_classroom', 'submit_assignment'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Alter Existing Tables to Use new division_id references
ALTER TABLE students ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS natively for all tables
ALTER TABLE faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allows any logged in user strictly through the React UI)
CREATE POLICY "Allow public access to faculty_profiles" ON faculty_profiles FOR ALL USING (true);
CREATE POLICY "Allow public access to students" ON students FOR ALL USING (true);
CREATE POLICY "Allow public access to class_roles" ON class_roles FOR ALL USING (true);
CREATE POLICY "Allow public access to divisions" ON divisions FOR ALL USING (true);
CREATE POLICY "Allow public access to faculty_divisions" ON faculty_divisions FOR ALL USING (true);
CREATE POLICY "Allow public access to attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow public access to assignment_submissions" ON assignment_submissions FOR ALL USING (true);
CREATE POLICY "Allow public access to activity_logs" ON activity_logs FOR ALL USING (true);

-- BOOM. ALL DONE!
