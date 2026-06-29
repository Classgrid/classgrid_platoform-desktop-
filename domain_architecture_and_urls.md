# Classgrid Architecture & Domain Strategy (Master Reference)

This document serves as the permanent source of truth for the Classgrid architecture, encompassing both the backend/platform systems and the public-facing marketing websites, including database and CMS choices.

## 1. Application Architecture

The ecosystem consists of two entirely separate frontend applications, backed by a unified backend strategy.

### A. The Classgrid Platform (ERP & Dashboards)
- **Tech Stack:** React, Vite, TypeScript.
- **Purpose:** The core product. Handles all authenticated user flows, dashboards, administration, student learning, HR, attendance, etc.
- **Routing:** Built with React Router (`client/src/app/router.tsx`).
- **Domain Strategy:** Hosted on `*.classgrid.in` (wildcard). Organizations can attach custom domains (e.g., `erp.mycollege.edu`), which act as aliases to their subdomain.

### B. The College Website (Public/Marketing)
- **Tech Stack:** Next.js (App Router), React, TypeScript.
- **Location:** `C:\Users\nikhi\OneDrive\Documents\classgird_college_webiste`
- **Purpose:** The public-facing website for institutions (e.g., "Welcome to XYZ College", Admissions info, About Us). Highly SEO optimized.
- **CMS:** **Sanity CMS** is used to manage all dynamic content (news, events, notices, gallery).
- **Domain Strategy:** Typically hosted on the root domain (`www.mycollege.edu`).

### C. Backend & Database
- **Primary Database:** **MongoDB**
- **Authentication:** Unified across the platform.

---

## 2. Platform Domain & Routing Logic (Case 1)

When users access the Classgrid Platform (`*.classgrid.in`), the router handles them based on their intent and role.

### The "Front Door" Fallback (`orgname.classgrid.in`)

What happens when a user navigates to the bare Classgrid subdomain depends entirely on whether the school has purchased the **College Website** module.

#### Scenario A: They DO NOT have the College Website (ERP Only)
- **What happens:** The router intercepts the root `/` path.
- **The Redirect:** The system automatically redirects them to the unified Student/Faculty login page (`/login`).
- **Why?** Since they don't have a public College Website, the bare URL acts as the front door to the ERP. 99% of bare-URL traffic comes from standard end-users (students and faculty), so defaulting to their login provides the best UX. 
- **The Security Rule (Separated Login):** Org Admins and Department Admins **NEVER** use this root URL. They have a completely separate, hidden login page (`/org/login` or `/admin/login`). This is a critical B2B enterprise security pattern that keeps administrative entry points hidden from the thousands of students trying to access the main page.

#### Scenario B: They DO have the College Website
- **What happens:** The `orgname.classgrid.in` root URL points to the **Next.js** application instead of redirecting to the login page.
- **The Process:** The Next.js app dynamically reads the `orgname` from the URL, queries the **MongoDB** `WebsiteSettings` collection, and renders a beautiful, fully-styled public College Website (using the school's custom colors, logos, and text).
- **ERP Integration:** The public website features "Portal Login" buttons in the header. These buttons link directly to the specific ERP paths (e.g., `orgname.classgrid.in/student/login` or `orgname.classgrid.in/org/admin/dashboard`). 
- **Routing Magic:** The system uses a reverse proxy (like Vercel rewrites). The Next.js app handles the College Website pages (`/`, `/about`), while all ERP portal paths (`/dept/*`, `/org/*`, `/student/*`) are seamlessly routed to the Vite ERP application.

### Portal Paths (Example using demo org: `vtech`)
The system strictly relies on specific paths to route different administrative and user roles. Whether using the `vtech.classgrid.in` subdomain or their Custom Domain (`erp.vtech.edu`), the URL paths remain identical.

| Portal / Role | Concrete URL Example |
| :--- | :--- |
| **Student Login** | `vtech.classgrid.in/student/login` |
| **Faculty Login** | `vtech.classgrid.in/faculty/login` |
| **Org Admin** | `vtech.classgrid.in/org/admin/dashboard` |
| **Admissions Dept** | `vtech.classgrid.in/dept/admissions/dashboard` |
| **Fees Dept** | `vtech.classgrid.in/dept/fees/dashboard` |
| **Examinations Dept**| `vtech.classgrid.in/dept/exams/dashboard` |
| **HR & Payroll Dept**| `vtech.classgrid.in/dept/hr/dashboard` |
| **Library Dept** | `vtech.classgrid.in/dept/library/dashboard` |
| **Hostel Dept** | `vtech.classgrid.in/dept/hostel/dashboard` |
| **Transport Dept** | `vtech.classgrid.in/dept/transport/dashboard` |

*Note: `/student/login` and `/faculty/login` render the same unified component, but passing distinct paths allows the router to pre-select the correct tab for the user, saving them a click.*

---

## 3. Custom Domain Verification & Fallback

- **Always Active Fallback:** The default Classgrid subdomain (`orgname.classgrid.in`) remains permanently active, even after a custom domain is verified. This ensures admins never get locked out during DNS propagation or if their custom domain expires.
- **Strict White-labeling (Toggle):** Once a custom domain is verified, the organization can toggle "Strict White-labeling". If enabled, general visits to the `classgrid.in` subdomain will redirect to the custom domain.
- **CRITICAL SECURITY RULE (The Unbreakable Backdoor):** The Org Admin login portal (`/org/login`) and dashboard (`/org/admin/dashboard`) are intentionally immune to the "Strict White-labeling" redirect enforcement. If an admin completely disables their Classgrid URL and their custom DNS subsequently breaks or expires, they would be permanently locked out of their own ERP, requiring database-level engineering intervention by Classgrid support. Because this is extremely harmful and unscalable for our support team, we permanently hardcode the `/org/*` routes as immune. This guarantees the IT Admin can always safely reach their dashboard via `https://[org].classgrid.in/org/login` to fix any DNS disasters on their own.
---

## 4. The Unified Login & Smart Redirect Flow

Classgrid uses a highly intelligent "Unified Login" pattern to handle authentication for all users across the platform.

### The Unified Experience (All 10 Roles)
Because of Nikhil's architecture, there is a single, beautiful login page used by everyone (Students, Faculty, and all 8 Admin types).

1. **Smart Redirect:** When any user logs in, the backend validates their credentials and returns their exact role. The frontend router instantly redirects them to their correct dashboard (e.g., `/classrooms` for students, `/dept/hr/dashboard` for HR).
2. **Local Storage Memory:** Upon successful login, the system saves the user's role to the browser's `localStorage` (`classgrid:last-auth-role`).
3. **The Post-Logout Experience:** This is where the UX shines. When a user logs out and returns to the root login page, the system remembers exactly who they are!
   - If a Student logs out, the login page pre-selects the Student tab and dynamically says **"Welcome back, Student"**.
   - If a Faculty member logs out, it pre-selects the Faculty tab and says **"Welcome back, Faculty"**.
   - If a Department Admin (like HR) logs out, it says **"Welcome back, HR Admin"**.

This pattern provides a flawless, personalized experience across all 10 roles while keeping the architecture incredibly simple.

---

## 5. Custom Domain & Root URL Architecture

### Nikhil's Solution (The Chosen Architecture)

**The Upsell & Branding Strategy**
Nikhil's solution is built around an elegant freemium constraint that creates a clear difference between the basic ERP plan and the website-enabled plan. It encourages colleges to upgrade if they want their root domain to work as a complete public website.

**Scenario A: Website Module NOT Purchased**
If the college has not purchased the website module, their root domain (e.g., `aec.classgrid.in`) does **not** show a full public website. Instead, it shows a highly branded Classgrid ERP login page.

**The Target UI Design (Split-Screen Layout)**
The upcoming, fully realized login page will feature a premium B2B SaaS split-screen layout:
- **Left Side (Branding):** Showcases the Classgrid ERP value proposition alongside the specific College's Logo, Name, and basic contact details.
- **Right Side (Interactive Form):** The actual login form component. 

*Layout Mockup:*
```text
------------------------------------------------
|  Classgrid                     |  AEC Logo    |
|  Smart Education ERP           |  AEC College |
|                                |              |
|  Manage academics, fees,       |  Email       |
|  attendance, library, exams    |  Password    |
|  and more in one platform.     |  Login       |
------------------------------------------------
```
This login page serves as the entry point for the entire college. **It is common for ALL 10 ERP user roles.** Students, faculty, organization admins, and department admins all use this exact same branded login page. 
After they log in, the backend checks their role and automatically redirects them to their correct dashboard.

**Scenario B: Website Module Purchased**
If the website module is active, the root domain (`aec.classgrid.in`) transforms into the full public college website (fetching its data from MongoDB). The ERP remains fully accessible, but the front door is now a complete marketing site instead of just a login page.

---

## 6. The "Game Changer": Custom Domains

When a college brings their **own** custom domain, the game changes completely. Because they own the domain, we do NOT show the generic Classgrid upsell page. 

Just like we mapped out `vtech.classgrid.in`, here is exactly how Custom Domains work based on their subscription:

### Scenario A: They DO NOT buy the Website (ERP Only)
If they already have a public website on `vtech.edu`, they just create a CNAME (`erp.vtech.edu`) pointing to Classgrid. Because this subdomain is purely for the ERP, it reverts to the **Maximum Security Separated Login**.

| Portal / Role | Custom Domain Concrete URL |
| :--- | :--- |
| **Student / Faculty Login** | `erp.vtech.edu/login` (or bare `erp.vtech.edu`) |
| **Department Admins** | `erp.vtech.edu/admin/login` (Secret URL) |
| **Org Admin** | `erp.vtech.edu/org/login` (Ultimate Secret URL) |

### Scenario B: They DO buy the Website
If they use Classgrid to host their entire public website, they point their main root domain (`vtech.edu`) to us. The Next.js Website Builder takes over the root domain.

| Feature / Portal | Custom Domain Concrete URL |
| :--- | :--- |
| **Public Homepage** | `vtech.edu/` (Renders MongoDB content via Next.js) |
| **Unified ERP Login** | `vtech.edu/login` (Renders Nikhil's Split-Screen UI) |
| **Student Dashboard** | `vtech.edu/classrooms` |
| **Faculty Dashboard** | `vtech.edu/classrooms` |
| **Org Admin Dashboard** | `vtech.edu/org/admin/dashboard` |
| **Admissions Dept** | `vtech.edu/dept/admissions/dashboard` |
| **Fees Dept** | `vtech.edu/dept/fees/dashboard` |
| **Examinations Dept**| `vtech.edu/dept/exams/dashboard` |
| **HR & Payroll Dept**| `vtech.edu/dept/hr/dashboard` |
| **Library Dept** | `vtech.edu/dept/library/dashboard` |
| **Hostel Dept** | `vtech.edu/dept/hostel/dashboard` |
| **Transport Dept** | `vtech.edu/dept/transport/dashboard` |

*(Note: They can also still configure `erp.vtech.edu` as an alias if they prefer).*

---

## 7. Future Roadmap: The "Dual Custom Domain" Exception

### The Problem (Currently NOT Supported)
What if a college wants to buy the Website Module for their root domain (`vtech.edu`), but they want to keep all ERP traffic on a completely separate dedicated subdomain (`erp.vtech.edu`)? 
*Currently, this is impossible because the Classgrid database and `CustomDomainCard` UI only support saving **ONE** custom domain per organization.*

### How We Will Build It (Future Architecture)
To support this "Exception Case", we will need to implement a Dual-Domain architecture:

1. **Database Upgrades:** Add a new column to the `organizations` table. 
   - `custom_domain`: Stores the marketing website domain (e.g., `vtech.edu`).
   - `erp_domain`: Stores the dedicated ERP domain (e.g., `erp.vtech.edu`).
2. **Settings UI Upgrades:** Update `CustomDomainCard.tsx` to allow verifying two separate domains.
3. **Next.js Middleware Routing:** 
   - When a request hits the Next.js reverse proxy, it checks the hostname.
   - If hostname matches `custom_domain` (`vtech.edu`), it queries MongoDB and renders the public website. The "Portal Login" button in the header will link outward to `https://erp.vtech.edu`.
   - If hostname matches `erp_domain` (`erp.vtech.edu`), Next.js skips the website builder entirely and proxies the request straight to the Vite ERP app.
4. **The User Experience:** The ERP domain (`erp.vtech.edu`) would function exactly like the "Maximum Security Separated Login". The root goes to the Student/Faculty login, and Admins manually type their hidden `erp.vtech.edu/org/login` URLs. 

This architecture perfectly completely decouples the marketing website from the ERP traffic while maintaining absolute white-labeling!

---

## 8. The Implementation Checklist (Execution Roadmap)

To bring this entire architectural master plan to life in the codebase, the following 5 tasks must be implemented sequentially:

1. **Login Rule Conflict Cleanup:** Update the React Router (`router.tsx`) and layout components to dynamically switch between the Unified Login behavior (for `*.classgrid.in`) and the Separated Login behavior (for custom ERP domains).
2. **Dual Custom Domain Implementation:** Update the database schema to support an `erp_domain` column and upgrade the `CustomDomainCard.tsx` UI to accept and verify both domains.
3. **Domain Resolver Logic:** Build robust middleware (in Node.js/Next.js) to inspect the incoming `Host` header and accurately determine if it's a Classgrid subdomain, a marketing custom domain, or a dedicated ERP custom domain.
4. **Reverse Proxy Rule Testing:** Thoroughly configure and test the Vercel/Next.js `rewrites()` to ensure that traffic proxying to the Vite app maintains all necessary authentication headers, cookies, and tokens without fail.
5. **Admin Backdoor Guarantee:** Hardcode the immune rule in the middleware ensuring that requests to `https://[org].classgrid.in/org/*` are **never** subjected to "Strict White-labeling" redirects, mathematically guaranteeing the Org Admin's unbreakable backdoor.
