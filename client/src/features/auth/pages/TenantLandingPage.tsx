import "./TenantLandingPage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  ClipboardList,
  Wallet,
  Users,
  Clock,
  Briefcase,
  ExternalLink,
  Loader2,
} from "lucide-react";

type TenantInfo = {
  id: string;
  name: string;
  subdomain: string;
  structure_type: string;
  logo_url: string;
  tagline: string;
  admission_portal_open: boolean;
};

const ADMIN_PORTALS = [
  { label: "Organization Admin", icon: Building2, description: "Manage your institution", path: "/admin-login" },
  { label: "Admissions", icon: ClipboardList, description: "Applications & enrollment", path: "/admin-login?role=admission_head" },
  { label: "Fees & Accounts", icon: Wallet, description: "Fee collection & ledger", path: "/admin-login?role=fee_manager" },
  { label: "Examinations", icon: BookOpen, description: "Exams, results & grading", path: "/admin-login?role=exam_controller" },
  { label: "Library", icon: BookOpen, description: "Catalog & circulation", path: "/admin-login?role=library_manager" },
  { label: "Attendance", icon: Clock, description: "Track & reports", path: "/admin-login?role=org_admin" },
  { label: "HR & Payroll", icon: Briefcase, description: "Staff management", path: "/admin-login?role=hr_dept" },
  { label: "Hostel", icon: Users, description: "Rooms & transport", path: "/admin-login?role=hostel_dept" },
];

const ERP_PORTALS = [
  { label: "Student Portal", icon: GraduationCap, description: "Attendance, results, fees & more", path: "/student/login" },
  { label: "Faculty Portal", icon: ShieldCheck, description: "Classrooms, assignments & marks", path: "/faculty/login" },
];

export function TenantLandingPage() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0];

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`/api/tenant/info`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        if (data.success && data.tenant) {
          setTenant(data.tenant);
        } else {
          setError(true);
        }
      } catch {
        // Fallback: use subdomain as name
        setTenant({
          id: "",
          name: subdomain.toUpperCase(),
          subdomain,
          structure_type: "",
          logo_url: "",
          tagline: "Institution ERP Portal",
          admission_portal_open: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [subdomain]);

  if (loading) {
    return (
      <div className="tenant-landing-loader">
        <Loader2 className="spinner" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="tenant-landing-loader">
        <Building2 size={48} style={{ opacity: 0.3 }} />
        <h2>Institution not found</h2>
        <p>The subdomain <strong>{subdomain}</strong> is not registered.</p>
      </div>
    );
  }

  return (
    <div className="tenant-landing">
      {/* ── BACKGROUND ── */}
      <div className="tenant-landing__bg" />

      {/* ── HEADER ── */}
      <header className="tenant-landing__header">
        <div className="tenant-landing__brand">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="tenant-landing__logo" />
          ) : (
            <div className="tenant-landing__logo-placeholder">
              <Building2 size={32} />
            </div>
          )}
          <div>
            <h1 className="tenant-landing__name">{tenant.name}</h1>
            {tenant.tagline && <p className="tenant-landing__tagline">{tenant.tagline}</p>}
          </div>
        </div>
        <div className="tenant-landing__badge">
          <span>Powered by</span>
          <strong>Classgrid</strong>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="tenant-landing__main">

        {/* ── STUDENT / FACULTY ERP ── */}
        <section className="tenant-landing__section">
          <h2 className="tenant-landing__section-title">
            <GraduationCap size={20} />
            Student & Faculty ERP
          </h2>
          <div className="tenant-landing__grid tenant-landing__grid--erp">
            {ERP_PORTALS.map((portal) => (
              <button
                key={portal.path}
                className="tenant-landing__card tenant-landing__card--erp"
                onClick={() => navigate(portal.path)}
              >
                <div className="tenant-landing__card-icon">
                  <portal.icon size={28} />
                </div>
                <div className="tenant-landing__card-text">
                  <h3>{portal.label}</h3>
                  <p>{portal.description}</p>
                </div>
                <ExternalLink size={16} className="tenant-landing__card-arrow" />
              </button>
            ))}
          </div>
        </section>

        {/* ── ADMIN PORTALS ── */}
        <section className="tenant-landing__section">
          <h2 className="tenant-landing__section-title">
            <ShieldCheck size={20} />
            Administration Portals
          </h2>
          <div className="tenant-landing__grid tenant-landing__grid--admin">
            {ADMIN_PORTALS.map((portal) => (
              <button
                key={portal.path + portal.label}
                className="tenant-landing__card tenant-landing__card--admin"
                onClick={() => navigate(portal.path)}
              >
                <div className="tenant-landing__card-icon tenant-landing__card-icon--admin">
                  <portal.icon size={22} />
                </div>
                <div className="tenant-landing__card-text">
                  <h3>{portal.label}</h3>
                  <p>{portal.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── ADMISSION PORTAL (if open) ── */}
        {tenant.admission_portal_open && (
          <section className="tenant-landing__section">
            <button
              className="tenant-landing__admission-cta"
              onClick={() => navigate(`/apply/${tenant.id}`)}
            >
              <ClipboardList size={24} />
              <div>
                <h3>Apply for Admission</h3>
                <p>Online admission portal is open — Apply now</p>
              </div>
              <ExternalLink size={18} />
            </button>
          </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="tenant-landing__footer">
        <p>
          {tenant.name} ERP Portal &middot; Managed on{" "}
          <a href="https://classgrid.in" target="_blank" rel="noopener noreferrer">
            Classgrid
          </a>
        </p>
        <p className="tenant-landing__footer-note">
          If your institution already has a website, you can link to{" "}
          <code>{subdomain}.classgrid.in</code> from there.
        </p>
      </footer>
    </div>
  );
}
