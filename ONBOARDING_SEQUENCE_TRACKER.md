# Comprehensive Onboarding Sequence & Status Tracker

This document maps out the EXACT overarching flow of how an Organization progresses from initial provisioning to full operational setup. It strictly separates the "Gateway" onboarding (onboard.classgrid.in) from the "Core Setup" (inside the Admin Dashboard). This will serve as the source of truth for the Super Admin UI Flowchart.

---

## 🟡 Phase 1: The Gateway (onboard.classgrid.in)
*These steps are completed immediately by the primary decision-maker before they even reach the main ERP dashboard. While in this phase, the Super Admin dashboard considers the Sandbox to be **"Setup In Progress"**.*

- ✅ **Step 1: Provisioning & Activation Link Sent** 
  - (Super Admin provisions Sandbox, Admin receives email link).
- ✅ **Step 2: Tenant Created** 
  - (Admin completes the 13-screen wizard on `onboard.classgrid.in`: Account created, verified, profile set, password set).
- ✅ **Step 3: Branding Configured** 
  - (Admin sets Logo, Colors, and their base ERP Subdomain `orgname.classgrid.in` within the wizard).

*Once Step 3 is submitted, `mustResetPassword` becomes false, the Admin logs into the main ERP dashboard, and the Sandbox status officially becomes **"Sandbox"**.*

---

## 🟢 Phase 2: Core Setup (Inside Admin Dashboard)
*Once logged into the main dashboard, the Organization Admin takes over to build the foundation. The Super Admin dashboard flow chart will track these specific milestones.*

- ✅ **Step 4: First Login Completed** 
  - (Tracked automatically the first time the Admin hits the dashboard).
- ✅ **Step 5: Domains Configured** 
  - (Admin configures their Custom Domain or ERP Subdomain).
- ✅ **Step 6: Admins Invited** 
  - (Root Admin invites other module admins/co-admins to assist).
- ✅ **Step 7: Academic Hierarchy Set** 
  - (Admin configures the structural foundation: Standards, Divisions, Semesters, or Courses depending on the institution type).

---

## 🔵 Phase 3: Data Migration (Inside Admin Dashboard)
*The Admin begins moving their physical data into Classgrid.*

- ✅ **Step 8: Faculties Imported** 
  - (Admin bulk-imports faculty/teachers via CSV).
- ✅ **Step 9: Students Imported** 
  - (Students are imported in bulk via CSV and mapped to the Academic Hierarchy).

> [!TIP]
> **CRITICAL INSIGHT:** The CSV Data Migration (Steps 8 & 9) is **ONLY for the very first time** the school sets up Classgrid. For the next academic year and beyond, they will NOT use CSV imports. Instead, the **Admission Module** and Admin workflows will organically handle all new student and staff intake!

---

## 🟣 Phase 4: Departmental Configuration (Inside Admin Dashboard)
*Specific module admins configure their respective modules using the imported Students, Faculty, and Hierarchy.*

- ✅ **Step 10: Fee Structure Configured** 
  - (Fee Manager sets up installments, ledgers, and payment gateways).
- ✅ **Step 11: Admission Form Configured** 
  - (Admission Dept opens the portal, sets form logic, and defines seat matrix).

*(The following modules are configured alongside or after the core steps, heavily utilizing the imported student database):*
- **Library Configuration:** The Library Manager catalogs books. Borrowing links directly to student profiles.
- **Attendance Configuration:** Faculty and Admins set up attendance policies. Teachers use the imported student lists to mark daily attendance.
- **Hostel Configuration:** The Hostel Warden configures rooms and allocates beds directly to the imported students.
- **Canteen Configuration:** The Canteen Manager handles inventory. Students use their ID cards for meals.
- **Exam Configuration:** The Exam Controller sets up grading scales (Term 1, Term 2). Teachers organically enter marks.
- *(Future)* **HR Configuration:** HR Admin manages payroll and leave requests for imported staff/faculty.

---

## 🌐 Phase 5: Payment Gateway Architecture
Classgrid utilizes a dual payment gateway strategy to completely separate B2B SaaS revenue from B2C school fee collections.

- **Easebuzz (B2C: Student ➡️ College)**
  - *Used By:* Admission Department, Fee Manager, and Students.
  - *Setup Location:* Configured in entirely separate billing settings inside the Admission Dashboard and Fee Dashboard.
  - *Purpose:* Easebuzz strictly handles the heavy flow of tuition fees and admission fees directly from the Student/Parent to the College's bank account.

- **Razorpay (B2B: College ➡️ Classgrid)**
  - *Used By:* Organization Admin (Super Admin billing).
  - *Setup Location:* Configured in a separate, isolated billing setup page inside the Organization Admin Dashboard.
  - *Purpose:* Razorpay is strictly used to collect the Classgrid ERP subscription fees (e.g., upgrading from a 31-day Sandbox to Active Production). This ensures Classgrid's SaaS revenue is isolated from student fee transactions.
