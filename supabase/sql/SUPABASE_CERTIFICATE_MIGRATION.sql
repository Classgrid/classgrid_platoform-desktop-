-- ==============================================================================
-- CERTIFICATE MODULE MIGRATION
-- Description: Creates certificates + trusted_domains + seeds 50+ platforms
-- ==============================================================================

-- 1. Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    student_id VARCHAR(255) NOT NULL,          -- Mongo User ID
    division_id UUID,                           -- Links to divisions
    classroom_id VARCHAR(255),                  -- Mongo Classroom ID (optional, for subject-specific certs)
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('course', 'olympiad', 'event', 'competition', 'other')),
    issuer TEXT,                                 -- e.g. Coursera, School
    subject TEXT,                                -- Optional subject tag
    certificate_date DATE,
    valid_until DATE,                           -- For expiring certs (AWS, etc.)
    file_url TEXT,                               -- Supabase Storage / S3 URL (NOT base64)
    certificate_link TEXT,                       -- External verification URL
    verification_status TEXT DEFAULT 'normal' CHECK (verification_status IN ('normal', 'pending', 'verified', 'rejected')),
    verification_method TEXT CHECK (verification_method IN ('domain_match', 'manual_verified', 'document_uploaded', NULL)),
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    added_by VARCHAR(255),                      -- Who created this record (userId)
    added_by_role TEXT,                          -- 'student', 'teacher', 'org_admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Duplicate prevention: same student + same title + same date = blocked
CREATE UNIQUE INDEX IF NOT EXISTS idx_cert_no_duplicates
    ON certificates (student_id, title, certificate_date);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_cert_org ON certificates(org_id);
CREATE INDEX IF NOT EXISTS idx_cert_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_division ON certificates(division_id);
CREATE INDEX IF NOT EXISTS idx_cert_type ON certificates(type);
CREATE INDEX IF NOT EXISTS idx_cert_status ON certificates(status);

-- 4. Auto-update trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_certificate_modtime') THEN
        CREATE FUNCTION update_certificate_modtime()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER update_certificates_modtime
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_certificate_modtime();

-- ==============================================================================
-- TRUSTED DOMAINS TABLE + SEED DATA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS trusted_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_name TEXT NOT NULL UNIQUE,
    platform_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('mooc', 'gov', 'tech', 'coding', 'olympiad', 'university')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: MOOC / Online Courses
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('coursera.org', 'Coursera', 'mooc'),
    ('udemy.com', 'Udemy', 'mooc'),
    ('edx.org', 'edX', 'mooc'),
    ('futurelearn.com', 'FutureLearn', 'mooc'),
    ('skillshare.com', 'Skillshare', 'mooc'),
    ('udacity.com', 'Udacity', 'mooc'),
    ('datacamp.com', 'DataCamp', 'mooc'),
    ('pluralsight.com', 'Pluralsight', 'mooc'),
    ('khanacademy.org', 'Khan Academy', 'mooc'),
    ('codecademy.com', 'Codecademy', 'mooc'),
    ('sololearn.com', 'SoloLearn', 'mooc'),
    ('alison.com', 'Alison', 'mooc'),
    ('simplilearn.com', 'Simplilearn', 'mooc'),
    ('greatlearning.in', 'Great Learning', 'mooc'),
    ('upgrad.com', 'upGrad', 'mooc'),
    ('scaler.com', 'Scaler', 'mooc'),
    ('ineuron.ai', 'iNeuron', 'mooc'),
    ('learnvern.com', 'LearnVern', 'mooc'),
    ('openlearning.com', 'OpenLearning', 'mooc'),
    ('iversity.org', 'iversity', 'mooc')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: India Gov / National
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('nptel.ac.in', 'NPTEL', 'gov'),
    ('swayam.gov.in', 'SWAYAM', 'gov'),
    ('ugc.ac.in', 'UGC', 'gov'),
    ('aicte-india.org', 'AICTE', 'gov'),
    ('nsdcindia.org', 'NSDC', 'gov'),
    ('msde.gov.in', 'MSDE', 'gov'),
    ('digitalindia.gov.in', 'Digital India', 'gov'),
    ('india.gov.in', 'India Gov', 'gov'),
    ('mygov.in', 'MyGov', 'gov'),
    ('skillindia.gov.in', 'Skill India', 'gov')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Tech / Cloud
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('cloud.google.com', 'Google Cloud', 'tech'),
    ('aws.amazon.com', 'AWS', 'tech'),
    ('learn.microsoft.com', 'Microsoft Learn', 'tech'),
    ('oracle.com', 'Oracle', 'tech'),
    ('ibm.com', 'IBM', 'tech'),
    ('redhat.com', 'Red Hat', 'tech'),
    ('salesforce.com', 'Salesforce', 'tech'),
    ('meta.com', 'Meta', 'tech')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Coding / Practice
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('hackerrank.com', 'HackerRank', 'coding'),
    ('leetcode.com', 'LeetCode', 'coding'),
    ('codechef.com', 'CodeChef', 'coding'),
    ('codeforces.com', 'Codeforces', 'coding'),
    ('geeksforgeeks.org', 'GeeksforGeeks', 'coding'),
    ('freecodecamp.org', 'freeCodeCamp', 'coding')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Competitions / Olympiad
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('sofworld.org', 'SOF', 'olympiad'),
    ('silverzone.org', 'Silverzone', 'olympiad'),
    ('unifiedcouncil.com', 'Unified Council', 'olympiad'),
    ('olympiadsuccess.com', 'Olympiad Success', 'olympiad')
ON CONFLICT (domain_name) DO NOTHING;

-- Seed: Universities
INSERT INTO trusted_domains (domain_name, platform_name, category) VALUES
    ('mit.edu', 'MIT', 'university'),
    ('stanford.edu', 'Stanford', 'university'),
    ('harvard.edu', 'Harvard', 'university'),
    ('ox.ac.uk', 'Oxford', 'university'),
    ('cam.ac.uk', 'Cambridge', 'university')
ON CONFLICT (domain_name) DO NOTHING;
