import { useEffect, useState, type FormEvent } from "react";
import { Mail, MapPin, HelpCircle, Lock, Eye, EyeOff, GraduationCap, Users, Globe, Facebook, Instagram, Linkedin, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getGoogleAuthUrl, loginWithPassword, verifyDeviceOtp, resendDeviceOtp, getAuthBranding, requestPasswordReset } from "../api";
import { getRedirectPath, saveStoredAuthRole, readStoredAuthRole, getRoleLabel, getPortalLabel, isInstitutionAdminRole } from "../auth-helpers";
import type { AuthUserRole, AuthLoginRole, AuthBranding } from "../types";
import { toast } from "sonner";

/* â”€â”€ Constants â”€â”€ */
const RECAPTCHA_SITE_KEY = "6LdMY0ItAAAAAJ5FixSMY_zlJ17ulMJzkiEQUYQi";

const DEFAULT_CAMPUS = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=550&h=720&auto=format&fit=crop";

export function CustomDomainAdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);

  // â”€â”€ Branding State â”€â”€
  const [branding, setBranding] = useState<AuthBranding | null>(null);
  const [brandingError, setBrandingError] = useState(false);

  // â”€â”€ Backend State â”€â”€
  const [step, setStep] = useState<1 | "device">(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "info" } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [rememberedRole, setRememberedRole] = useState<AuthLoginRole | null>(null);

  useEffect(() => {
    setRememberedRole(readStoredAuthRole());
  }, []);

  useEffect(() => {
    let isMounted = true;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.startsWith("127.0.0.1");
    const isClassgrid = hostname.endsWith("classgrid.in");
    
    const searchParams = new URLSearchParams(location.search);
    const subdomain = (isClassgrid || isLocalhost) && hostname.includes(".") ? hostname.split(".")[0] : undefined;
    const slug = searchParams.get("slug") || searchParams.get("org") || (subdomain !== "superadmin" ? subdomain : undefined);
    const customDomain = (!isClassgrid && !isLocalhost) ? hostname : undefined;

    getAuthBranding({ authType: "institution", slug, domain: customDomain })
      .then((result) => {
        if (isMounted) setBranding(result);
      })
      .catch(() => {
        if (isMounted) setBrandingError(true);
      });

    return () => { isMounted = false; };
  }, [location.search]);

  useEffect(() => {
    if (branding?.siteTitle) {
      document.title = branding.siteTitle;
      localStorage.setItem("org_title", branding.siteTitle);
    } else if (branding?.name) {
      document.title = branding.name;
      localStorage.setItem("org_title", branding.name);
    }

    if (branding?.faviconUrl) {
      localStorage.setItem("org_favicon", branding.faviconUrl);
      
      const existingLinks = document.querySelectorAll("link[rel~='icon']");
      existingLinks.forEach(link => link.remove());
      
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.href = branding.faviconUrl;
      document.head.appendChild(newLink);
    }
  }, [branding]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("device_verify") === "true") {
      const redirectEmail = params.get("email") || "";
      if (redirectEmail) {
        setEmail(redirectEmail);
        setStep("device");
        setOtpCooldownSeconds(60);
        setFeedback({
          message: "New device detected. A verification code has been sent to your email.",
          tone: "info",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (step !== "device" || otpCooldownSeconds <= 0) return;
    const timer = window.setInterval(() => setOtpCooldownSeconds((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldownSeconds, step]);

  const effectiveRole = isInstitutionAdminRole(rememberedRole) ? rememberedRole : "org_admin";

  const titleText = isInstitutionAdminRole(rememberedRole)
    ? `Welcome back, ${getRoleLabel(rememberedRole)}`
    : "Admin Portal";

  const subtitleText = isInstitutionAdminRole(rememberedRole)
    ? `Continue to the ${getPortalLabel(rememberedRole)} for ${branding?.name || "your institution"}.`
    : `Sign in to access your administrative workspace`;

  const rememberLoggedInUser = (result: any) => {
    if (!result.user) return;
    queryClient.setQueryData(["current-user"], {
      _id: result.user.id,
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      organization_id: result.user.organization_id,
    });
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password || isSubmitting) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithPassword({
        email: email.trim(),
        password,
        audience: "admin",
        role: effectiveRole,
      });

      if (result.needsDeviceOtp) {
        setPassword("");
        setOtp("");
        setOtpCooldownSeconds(result.retryAfterSeconds || 60);
        setFeedback({
          message: result.message || "A verification code has been sent to your registered email.",
          tone: "info",
        });
        setStep("device");
        return;
      }

      rememberLoggedInUser(result);
      saveStoredAuthRole(result.user?.role || effectiveRole);
      navigate(getRedirectPath(result.user?.role), { replace: true });
    } catch (error: any) {
      if (error && typeof error === "object" && "needsDeviceOtp" in error) {
        setPassword("");
        setOtp("");
        setOtpCooldownSeconds(error.retryAfterSeconds || 60);
        setFeedback({
          message: error.message || "A verification code has been sent.",
          tone: "info",
        });
        setStep("device");
        return;
      }
      setFeedback({ message: error?.message || "Login failed. Please try again.", tone: "error" });
      setShowForgotPassword(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDevice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otp || isSubmitting) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await verifyDeviceOtp({ email: email.trim(), otp: otp.trim() });
      rememberLoggedInUser(result);
      saveStoredAuthRole(result.user?.role || effectiveRole);
      navigate(getRedirectPath(result.user?.role), { replace: true });
    } catch (error: any) {
      setFeedback({ message: error?.message || "Device verification failed.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || isResendingOtp || otpCooldownSeconds > 0) return;
    setFeedback(null);
    setIsResendingOtp(true);
    try {
      const result = await resendDeviceOtp(email.trim());
      setOtpCooldownSeconds(60);
      setFeedback({ message: result.message || "OTP sent successfully.", tone: "info" });
    } catch (error: any) {
      setOtpCooldownSeconds(error?.retryAfterSeconds || 60);
      setFeedback({ message: error?.message || "Could not resend OTP.", tone: "error" });
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleForgotPasswordClick = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    const toastId = toast.loading("Sending reset link...");
    try {
      const response = await requestPasswordReset(email.trim());
      toast.success(response?.message || "If the email is registered, a password reset link has been sent.", { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to send reset link.", { id: toastId });
    }
  };

  const handleGoogleContinue = () => {
    saveStoredAuthRole(effectiveRole);
    window.location.assign(getGoogleAuthUrl({ audience: "admin", role: effectiveRole }));
  };

  // Load Google reCAPTCHA v3 â€” shows official badge at bottom-right
  useEffect(() => {
    if (brandingError || !branding) return;

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      try { document.head.removeChild(script); } catch {}
      document.querySelectorAll(".grecaptcha-badge").forEach((el) => el.remove());
    };
  }, [branding, brandingError]);

  if (brandingError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background dark:bg-[#080808] text-white text-center">
        <img src="/logo.png" alt="Classgrid" className="h-16 w-16 object-contain mb-6 opacity-80" />
        <h2 className="text-2xl font-semibold mb-2">Institution Not Found</h2>
        <p className="text-muted-foreground dark:text-white/60">This login portal does not exist or has been moved.</p>
      </div>
    );
  }

  // Prevent flashing empty screen before branding loads
  if (!branding) {
    return <div className="h-screen w-screen bg-background dark:bg-[#080808]" />;
  }



  return (
    /* 1. Full Screen â€” fills exactly the viewport, never scrolls */
    <main className="h-screen w-screen bg-background dark:bg-[#0f0f0f]">

      {/* Container holding the 2-column grid */}
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2 overflow-hidden">

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* 3. LEFT PANEL                               */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section className="relative flex flex-col bg-background dark:bg-[#0f0f0f] border-r border-border dark:border-white/[0.15] overflow-hidden">
          
          {/* 1. Full-Bleed Campus Photo */}
          {/* Max Dimensions for this image to fit cut-to-cut on desktop: 550px width by 720px height */}
          <img
            src={branding.campusImageUrl || DEFAULT_CAMPUS}
            alt="Campus"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          {/* 2. Dark Gradient Overlay for Readability */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)",
            }}
            aria-hidden="true"
          />

          {/* Spacer to push content to the bottom */}
          <div className="flex-1" />

          {/* 3. Bottom Content (over the photo) */}
          <div className="relative z-10 px-10 pb-12">
            {/* 4. Real Social Links */}
            <div className="flex items-center gap-4">
              {branding.socialLinks?.website_url && (
                <a href={branding.socialLinks.website_url} target="_blank" rel="noopener noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/30">
                  <Globe size={20} />
                </a>
              )}
              {branding.socialLinks?.facebook_url && (
                <a href={branding.socialLinks.facebook_url} target="_blank" rel="noopener noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/30">
                  <img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/facebook-icon-logo-svgrepo-com.svg" alt="Facebook" className="w-5 h-5 object-contain" />
                </a>
              )}
              {branding.socialLinks?.instagram_url && (
                <a href={branding.socialLinks.instagram_url} target="_blank" rel="noopener noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/30">
                  <img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/instagram-2-1-logo-svgrepo-com.svg" alt="Instagram" className="w-5 h-5 object-contain" />
                </a>
              )}
              {branding.socialLinks?.linkedin_url && (
                <a href={branding.socialLinks.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/30">
                  <img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/linkedin-svgrepo-com.svg" alt="LinkedIn" className="w-5 h-5 object-contain" />
                </a>
              )}
              {branding.socialLinks?.twitter_url && (
                <a href={branding.socialLinks.twitter_url} target="_blank" rel="noopener noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/30">
                  <img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/Untitled%20folder/new-twitter-x-logo-twitter-icon-x-social-media-icon-free-png.webp" alt="X" className="w-5 h-5 object-contain" />
                </a>
              )}
              {branding.socialLinks?.youtube_url && (
                <a href={branding.socialLinks.youtube_url} target="_blank" rel="noopener noreferrer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/30">
                  <img src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/youtube-color-svgrepo-com.svg" alt="YouTube" className="w-5 h-5 object-contain" />
                </a>
              )}
            </div>
          </div>

          {/* 5. Support Button (Bottom-Left) */}
          <div className="absolute top-6 left-6 z-10">
            <a 
              href="https://classgrid.in/support/ticket"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[40px] items-center gap-2 rounded-full border border-border dark:border-white/20 bg-black/40 px-5 text-[13px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/60"
            >
              <HelpCircle className="h-[18px] w-[18px]" />
              Support
            </a>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* 8. RIGHT PANEL                              */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section className="flex h-full flex-col bg-muted dark:bg-[#111111] px-6 overflow-y-auto py-8">

            {/* 9. Inner Login Box */}
            <div className="flex w-full max-w-[500px] flex-col justify-center rounded-[24px] border border-border dark:border-white/[0.15] bg-background dark:bg-[#0f0f0f] px-10 py-8 shadow-xl shrink-0 m-auto">
              
              {step === 1 ? (
                <form onSubmit={handleLogin} className="flex flex-col">
                  {/* 10. College Header */}
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt={branding.name} className="mx-auto max-h-[85px] w-auto max-w-[240px] object-contain rounded-[12px]" />
                  )}
                  <h1 className="mt-4 text-center text-[24px] font-bold text-foreground dark:text-white">
                    {branding.name || titleText}
                  </h1>
                  <p className="mt-1 text-center text-[13px] text-muted-foreground dark:text-white/65">Welcome back!</p>
                  <p className="mt-0.5 text-center text-[13px] text-muted-foreground dark:text-white/65">{subtitleText}</p>

                  {/* 12. Google Button */}
                  <button type="button" onClick={handleGoogleContinue} className="mt-4 flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] border border-border dark:border-white/[0.14] bg-muted dark:bg-[#111111] text-[14px] font-medium text-foreground dark:text-white transition-colors hover:bg-zinc-200 dark:hover:bg-[#222222]">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Continue with Google
                  </button>

                  <div className="my-2 flex items-center gap-4">
                    <div className="h-px flex-1 bg-border dark:bg-white/[0.14]" />
                    <span className="text-[12px] text-muted-foreground dark:text-white/55">OR</span>
                    <div className="h-px flex-1 bg-border dark:bg-white/[0.14]" />
                  </div>

                  {/* 14. Email Input */}
                  <div className="flex h-[46px] items-center gap-3 rounded-[12px] border border-border dark:border-white/[0.14] bg-background dark:bg-[#141414] px-4 transition-colors focus-within:border-emerald-500/50">
                    <Mail className="h-[18px] w-[18px] shrink-0 text-muted-foreground dark:text-white/70" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent text-[14px] text-foreground dark:text-white outline-none placeholder:text-muted-foreground dark:placeholder-white/40 focus:ring-0 border-none focus:border-transparent" style={{ boxShadow: 'none', border: 'none', outline: 'none' }} placeholder="Email Address" />
                  </div>

                  {/* Password Input */}
                  <div className="mt-3 flex h-[46px] items-center gap-3 rounded-[12px] border border-border dark:border-white/[0.14] bg-background dark:bg-[#141414] px-4 transition-colors focus-within:border-emerald-500/50">
                    <Lock className="h-[18px] w-[18px] shrink-0 text-muted-foreground dark:text-white/70" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-transparent text-[14px] text-foreground dark:text-white outline-none placeholder:text-muted-foreground dark:placeholder-white/40 focus:ring-0 border-none focus:border-transparent" style={{ boxShadow: 'none', border: 'none', outline: 'none' }} placeholder="Password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted-foreground dark:text-white/70 transition-colors hover:text-white">
                      {showPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
                    </button>
                  </div>

                  {/* 15. Remember Me & Forgot Password */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#10b981]" />
                      <span className="text-[13px] text-foreground dark:text-white">Remember me</span>
                    </div>
                    {showForgotPassword && (
                      <button type="button" onClick={handleForgotPasswordClick} className="text-[13px] font-medium text-[#10b981] hover:underline">
                        Forgot password?
                      </button>
                    )}
                  </div>

                  {feedback && (
                    <div className={`mt-4 rounded-[12px] border px-3 py-2 text-[12px] leading-5 ${feedback.tone === "error" ? "border-red-500/35 bg-red-500/10 text-red-200" : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"}`}>
                      {feedback.message}
                    </div>
                  )}

                  {/* 17. Sign In Button */}
                  <button type="submit" disabled={isSubmitting || !email || !password} className="mt-4 h-[50px] w-full rounded-[14px] bg-[#10b981] text-[16px] font-bold text-white transition-colors hover:bg-[#059669] disabled:opacity-50 shadow-lg shadow-emerald-900/50">
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </button>

                  {/* 18. Terms Text */}
                  <p className="mt-3 text-center text-[12px] text-muted-foreground dark:text-white/55">
                    By signing in, you agree to our <a href="https://classgrid.in/terms" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">Terms</a> &amp; <a href="https://classgrid.in/privacy" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">Privacy Policy</a>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyDevice} className="flex flex-col">
                  <button type="button" onClick={() => setStep(1)} className="mb-4 inline-flex w-fit items-center gap-2 text-[14px] font-medium text-muted-foreground dark:text-white/60 transition-colors hover:text-emerald-400">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="text-center text-[22px] font-bold text-foreground dark:text-white">Verify this device</h2>
                  <p className="mt-1 text-center text-[13px] text-muted-foreground dark:text-white/65">Enter the one-time code sent to your email.</p>
                  
                  <div className="mt-5 flex h-[46px] items-center gap-3 rounded-[12px] border border-border dark:border-white/[0.14] bg-background dark:bg-[#141414] px-4 transition-colors focus-within:border-emerald-500/50">
                    <Lock className="h-[18px] w-[18px] shrink-0 text-muted-foreground dark:text-white/70" />
                    <input type="text" maxLength={6} inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required className="w-full bg-transparent text-[16px] text-foreground dark:text-white outline-none placeholder:text-muted-foreground dark:placeholder-white/40 tracking-[0.25em] focus:ring-0 border-none focus:border-transparent" style={{ boxShadow: 'none', border: 'none', outline: 'none' }} placeholder="000000" />
                  </div>

                  {feedback && (
                    <div className={`mt-4 rounded-[12px] border px-3 py-2 text-[13px] leading-5 ${feedback.tone === "error" ? "border-red-500/35 bg-red-500/10 text-red-200" : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"}`}>
                      {feedback.message}
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting || otp.length !== 6} className="mt-4 h-[50px] w-full rounded-[14px] bg-[#10b981] text-[16px] font-bold text-white transition-colors hover:bg-[#059669] disabled:opacity-50 shadow-lg shadow-emerald-900/50">
                    {isSubmitting ? "Verifying..." : "Verify Device"}
                  </button>

                  <button type="button" onClick={handleResendOtp} disabled={isResendingOtp || otpCooldownSeconds > 0} className="mt-3 h-[46px] w-full rounded-[12px] border border-border dark:border-white/[0.14] bg-transparent text-[14px] font-medium text-foreground dark:text-white transition-colors hover:bg-white/5 disabled:opacity-50">
                    {isResendingOtp ? "Sending..." : otpCooldownSeconds > 0 ? `Resend Code in ${otpCooldownSeconds}s` : "Resend Code"}
                  </button>
                </form>
              )}
            </div>
        </section>
      </div>
    </main>
  );
}
