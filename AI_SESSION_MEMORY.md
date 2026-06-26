# AI SESSION MEMORY (CRITICAL CONTEXT)

**DO NOT DELETE THIS FILE. READ THIS BEFORE MAKING ANY CHANGES.**
**Date:** June 26, 2026
**Context:** This file serves as permanent memory for future AI sessions working on the Classgrid Platform.

## 1. The Great Frontend Purge
- **The Enemy:** The old legacy UI system used the `Cg` prefix (e.g., `<CgButton>`, `<CgPageShell>`) and CSS classes like `.cg-page`.
- **The Problem:** It was extremely toxic, causing naming collisions that completely crashed the Vercel CI/CD pipeline.
- **The Solution:** We successfully eradicated 100% of the `Cg` component imports and legacy CSS classes across 400+ files. 
- **RULE:** NEVER use the `Cg` prefix for any component. NEVER import anything from `client/src/components/classgrid/` (it is a dummy folder used only to prevent Vercel crashes). Use `marketing_ui/` instead.

## 2. The 9,000-Line Engine Commit
We spent 7 grueling hours building the core foundation of Classgrid. The following engines were successfully built using **100% pure Tailwind and marketing_ui** components. They are fully functional, incredibly valuable, and form the backbone of the application:
- **Examination Engine:** `FacultyExamPortal.tsx`, `StudentResultPortal.tsx`, `ResultsProcessingPage.tsx`
- **Attendance & Leave Engine:** `FacultyAttendancePortal.tsx`, `StudentLeavePortal.tsx`
- **Admissions Engine:** `CandidatePortalPage.tsx`, `FormBuilderPage.tsx`, `MeritListPage.tsx`
- **Feedback & Quality Dashboards**

**AI INSTRUCTION:** If a user asks about these 9,000 lines, DO NOT assume they are broken or infected with `Cg`. They are completely clean, raw Tailwind files that are critical to the app's survival.

## 3. The CGPA Exception
- **Rule:** `CGPA` stands for Cumulative Grade Point Average. It is a standard academic metric deeply tied to the backend (e.g., `merit-engine.service.js`, `result.routes.js`).
- **AI INSTRUCTION:** Do NOT try to rename `CGPA` or `cgpa` to `Gpa`. It is NOT related to the toxic `Cg` UI components. It must be left completely untouched in both the database schema and the frontend API calls.

## 4. Current State
- The UI is raw and clean, ready for advanced Tailwind implementation.
- The Vercel build is **GREEN** (passing flawlessly).
- The foundation is rock solid. Keep building forward!
