import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loginWithPassword, getGoogleAuthUrl, requestPasswordReset } from "../api";
import { saveStoredAuthRole, getRedirectPath } from "../auth-helpers";
import "./SuperAdminVanilla.css";

export function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRescueMode, setIsRescueMode] = useState(false);
  const [rescueEmail, setRescueEmail] = useState("");
  const [rescuePassword, setRescuePassword] = useState("");

  // ðŸ” Domain Lock: Super Admin login is EXCLUSIVELY on superadmin.classgrid.in
  // If someone navigates to /superadmin/login on any other subdomain, hard-redirect them.
  useEffect(() => {
    const hostname = window.location.hostname;
    const isSuperAdminDomain = hostname === "superadmin.classgrid.in" || hostname === "localhost" || hostname.startsWith("127.0.0.1");
    if (!isSuperAdminDomain) {
      window.location.replace(`https://superadmin.classgrid.in/superadmin/login`);
    }
  }, []);

  useEffect(() => {
    // Load Recaptcha script dynamically to show the badge
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=6LdMY0ItAAAAAJ5FixSMY_zlJ17ulMJzkiEQUYQi";
    script.async = true;
    document.head.appendChild(script);

    window.RECAPTCHA_SITE_KEY = "6LdMY0ItAAAAAJ5FixSMY_zlJ17ulMJzkiEQUYQi";

    return () => {
      // Optional: Cleanup if needed when leaving the page
      document.head.removeChild(script);
      const badges = document.querySelectorAll(".grecaptcha-badge");
      badges.forEach(b => b.remove());
    };
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      // Set the intended role so the user object gets updated properly in backend (based on existing logic)
      saveStoredAuthRole("super_admin");
      
      const result = await loginWithPassword({ email, password, audience: "super_admin", role: "super_admin" });
      
      if (!result.user || result.user.role !== "super_admin") {
         toast.error("Access denied. Super Admin only.");
         setIsLoading(false);
         return;
      }

      // Save token to localStorage for apiClient fallback (solves Safari/cross-domain cookie drops)
      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      // Update global user state
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      
      // Redirect to dashboard based on role
      setTimeout(() => {
        navigate(result.user?.role === "super_admin" ? "/superadmin/dashboard" : "/");
      }, 500);

      toast.success("Login successful!");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    
    setIsResetting(true);
    try {
      await requestPasswordReset(email);
      toast.success("Reset email sent. Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Could not send reset email.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleRescueLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const axios = (await import("axios")).default;
      const r = await axios.post(`${import.meta.env.VITE_API_BASE_URL || ""}/api/rescue/login`, { 
         email: rescueEmail || "support@classgrid.in", 
         password: rescuePassword 
      });
      localStorage.setItem("rescue_token", r.data.token);
      toast.success("Rescue Mode Activated!");
      navigate("/superadmin/audit-logs");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to connect to Rescue Server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="super-admin-wrapper">

      <div className="container">
        {/* LEFT PANEL */}
        <div className="brand-panel">
          <div className="logo-section">
            <img src="/Classgrid.png" alt="Classgrid Logo" className="logo-img" />
            <div className="logo-text">
              <h1>Classgrid</h1>
            </div>
          </div>
          <div className="intro-description" style={{color: "rgba(255, 255, 255, 0.9)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "2rem", zIndex: 1}}>
            <p style={{marginBottom: "1rem"}}>A comprehensive educational ERP that unifies academic tracking, student information, and administrative workflows into a single intelligent platform.</p>
          </div>
          <div className="contact-info">
            <h3><i className="fas fa-address-card"></i> Contact Information</h3>
            <div className="contact-item"><i className="fas fa-envelope"></i><span>support@classgrid.in</span></div>
            <div className="contact-item"><i className="fas fa-map-marker-alt"></i><span>Sector 26, Pradhikaran, Nigdi, Pune, Maharashtra 411044</span></div>
          </div>

          <div className="social-links">
            <a href="https://www.instagram.com/classgridedu/" className="social-link" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="https://github.com/nikhilnick5050" className="social-link" target="_blank" rel="noreferrer" aria-label="GitHub"><i className="fab fa-github"></i></a>
            <a href="https://www.facebook.com/profile.php?id=61588646851017" className="social-link" target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
          </div>
        </div>

        {/* RIGHT AUTH PANEL */}
        <div className="auth-panel">
          <div className="auth-container">
            
            {/* LOGIN FORM */}
            {!isRescueMode ? (
            <form className="auth-form active" onSubmit={handleLogin}>
              <h2 className="form-title">Super Admin Portal</h2>
              <p className="form-subtitle">Secure system access</p>

              <div style={{ display: "flex", gap: "10px", flexDirection: "column", marginBottom: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => {
                    const url = getGoogleAuthUrl({ audience: "super_admin", role: "super_admin" });
                    if (url) window.location.href = url;
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "1rem",
                    background: "white",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#424242",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.background = "#f9f9f9";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: "20px" }} />
                  <span>Sign in with Google</span>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1rem 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
                <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: 500, textTransform: "uppercase" }}>OR</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loginEmail">Email Address</label>
                <div className="input-group">
                  <i className="fas fa-envelope input-icon"></i>
                  <input 
                    type="email" 
                    id="loginEmail" 
                    className="form-input"
                    placeholder="Enter your email address" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="loginPassword">Password</label>
                <div className="input-group">
                  <i className="fas fa-lock input-icon"></i>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="loginPassword" 
                    className="form-input"
                    placeholder="Enter your password" 
                    required 
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "fas fa-eye" : "fas fa-eye-slash"}></i>
                  </button>
                </div>
              </div>


              <button type="submit" className="submit-btn" disabled={isLoading}>
                <span>{isLoading ? "Signing in..." : "Sign In"}</span>
                {!isLoading && <i className="fas fa-sign-in-alt"></i>}
              </button>

              <button type="button" className="reset-password-btn" onClick={handleResetPassword} disabled={isResetting}>
                <span>{isResetting ? "Sending..." : "Reset Password"}</span>
                {!isResetting && <i className="fas fa-key"></i>}
              </button>
              <button type="button" className="reset-password-btn" onClick={() => setIsRescueMode(true)} style={{ marginTop: "1rem", color: "#e11d48" }}>
                <span>Emergency Rescue Login</span>
                <i className="fas fa-life-ring"></i>
              </button>
            </form>
            ) : (
            <form className="auth-form active" onSubmit={handleRescueLogin}>
              <h2 className="form-title" style={{ color: "#e11d48" }}>Rescue Mode</h2>

              <div className="form-group" style={{ marginTop: "2rem" }}>
                <label className="form-label" htmlFor="rescueEmail">Super Admin Email</label>
                <div className="input-group" style={{ marginBottom: "1rem" }}>
                  <i className="fas fa-envelope input-icon"></i>
                  <input 
                    type="email" 
                    id="rescueEmail" 
                    className="form-input"
                    placeholder="Enter your email" 
                    required 
                    value={rescueEmail}
                    onChange={e => setRescueEmail(e.target.value)}
                  />
                </div>

                <label className="form-label" htmlFor="rescuePassword">Rescue Password</label>
                <div className="input-group">
                  <i className="fas fa-lock input-icon"></i>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="rescuePassword" 
                    className="form-input"
                    placeholder="Enter RESCUE_PASSWORD" 
                    required 
                    value={rescuePassword}
                    onChange={e => setRescuePassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "fas fa-eye" : "fas fa-eye-slash"}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" style={{ background: "#e11d48" }} disabled={isLoading}>
                <span>{isLoading ? "Connecting..." : "Enter Rescue Mode"}</span>
                {!isLoading && <i className="fas fa-bolt"></i>}
              </button>

              <button type="button" className="reset-password-btn" onClick={() => setIsRescueMode(false)}>
                <span>Back to Normal Login</span>
                <i className="fas fa-arrow-left"></i>
              </button>
            </form>
            )}

            {/* Footer */}
            <div className="page-footer">
              <p>© {new Date().getFullYear()} Classgrid. All rights reserved.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
