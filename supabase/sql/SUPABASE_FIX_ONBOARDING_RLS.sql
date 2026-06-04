-- ==========================================
-- FIX SUPABASE RLS POLICIES FOR ONBOARDING
-- ==========================================
-- This script fixes the "new row violates row-level security policy" error
-- when creating divisions and faculty profiles. Because custom auth is used,
-- the backend and frontend execute these queries as the 'anon' role.
-- Previous policies only allowed SELECT (USING true) but blocked INSERTS.

-- Run this script in your Supabase SQL Editor.

DROP POLICY IF EXISTS "Allow public access to divisions" ON divisions;
CREATE POLICY "Allow public access to divisions" ON divisions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to faculty_profiles" ON faculty_profiles;
CREATE POLICY "Allow public access to faculty_profiles" ON faculty_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to faculty_divisions" ON faculty_divisions;
CREATE POLICY "Allow public access to faculty_divisions" ON faculty_divisions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to timetable_periods" ON timetable_periods;
CREATE POLICY "Allow public access to timetable_periods" ON timetable_periods FOR ALL USING (true) WITH CHECK (true);

-- (Optional but recommended) Fix students as well in case they need to sign up later:
DROP POLICY IF EXISTS "Allow public access to students" ON students;
CREATE POLICY "Allow public access to students" ON students FOR ALL USING (true) WITH CHECK (true);
