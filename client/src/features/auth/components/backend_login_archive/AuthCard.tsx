import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Separator } from "@/components/marketing_ui/separator";
import { cn } from "@/lib/utils";

import { checkEmailForLogin, getGoogleAuthUrl, loginWithPassword, requestPasswordReset, resendDeviceOtp, verifyDeviceOtp } from "../../api";
import {
  getPortalLabel,
  getRedirectPath,
  getRoleLabel,
  isInstitutionAdminRole,
  isUserRole,
  saveStoredAuthRole,
} from "../../auth-helpers";
import type { AuthAudience, AuthBranding, AuthLoginRole, AuthUserRole } from "../../types";

type RoleOption = {
  value: AuthUserRole;
  label: string;
  icon: typeof GraduationCap;
};

type MessageTone = "error" | "info";
type AuthStep = 1 | 2 | "device";

type AuthCardProps = {
  audience: AuthAudience;
  branding: AuthBranding;
  defaultRole: AuthLoginRole;
  initialMessage?: string | null;
  initialMessageTone?: MessageTone;
  initialDeviceVerification?: boolean;
  lockedRole?: AuthUserRole | null;
  preferredRole?: AuthUserRole | null;
  prefilledEmail?: string;
  rememberedRole?: AuthLoginRole | null;
  showRoleSwitcher?: boolean;
};

const roleOptions: RoleOption[] = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "teacher", label: "Faculty", icon: UserRound },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthCard({
  audience,
  branding,
  defaultRole,
  initialMessage,
  initialMessageTone = "error",
  initialDeviceVerification = false,
  lockedRole,
  preferredRole,
  prefilledEmail = "",
  rememberedRole,
  showRoleSwitcher = false,
}: AuthCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<AuthStep>(initialDeviceVerification && prefilledEmail ? "device" : 1);
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<AuthLoginRole>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(initialDeviceVerification ? 60 : 0);
  const [feedback, setFeedback] = useState<{ message: string; tone: MessageTone } | null>(
    initialMessage ? { message: initialMessage, tone: initialMessageTone } : null
  );

  const handleForgotPassword = async () => {
    if (!email) return;
    setIsResetting(true);
    setFeedback(null);
    try {
      await requestPasswordReset(email);
      setFeedback({
        message: "Reset link sent to your email!",
        tone: "info"
      });
    } catch (error: any) {
      setFeedback({
        message: error.response?.data?.message || "Could not send reset link.",
        tone: "error"
      });
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  useEffect(() => {
    setEmail(prefilledEmail);
  }, [prefilledEmail]);

  useEffect(() => {
    if (initialDeviceVerification && prefilledEmail) {
      setStep("device");
      setFeedback({
        message: "Enter the verification code sent to your email to trust this device.",
        tone: "info",
      });
    }
  }, [initialDeviceVerification, prefilledEmail]);

  useEffect(() => {
    setFeedback(initialMessage ? { message: initialMessage, tone: initialMessageTone } : null);
  }, [initialMessage, initialMessageTone]);

  useEffect(() => {
    if (step !== "device" || otpCooldownSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setOtpCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpCooldownSeconds, step]);

  const selectedUserRole: AuthUserRole = role === "teacher" ? "teacher" : "student";
  const effectiveRole = getEffectiveRole(audience, selectedUserRole, rememberedRole);
  const isEmailValid = emailPattern.test(email.trim());
  const canSubmitPassword = password.length > 0 && isEmailValid && !isSubmitting;
  const canSubmitOtp = otp.trim().length === 6 && isEmailValid && !isSubmitting;
  const stepCopy = getStepCopy({
    audience,
    branding,
    lockedRole,
    preferredRole,
    rememberedRole,
    step,
  });

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEmailValid || isSubmitting) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await checkEmailForLogin(email.trim());
      if (!result.exists) {
        setFeedback({
          message: "We sent an message to your email",
          tone: "info",
        });
        return;
      }

      setStep(2);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "We could not check this email right now. Please try again.";

      setFeedback({ message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setPassword("");
    setOtp("");
    setShowPassword(false);
    setFeedback(null);
    setStep(1);
  };

  const rememberLoggedInUser = (result: { user?: { id?: string; name: string; email: string; role: string; organization_id?: string | null } }) => {
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

  const moveToDeviceVerification = (message?: string, retryAfterSeconds = 60) => {
    setPassword("");
    setOtp("");
    setOtpCooldownSeconds(Math.max(0, retryAfterSeconds));
    setFeedback({
      message: message || "A verification code has been sent to your registered email.",
      tone: "info",
    });
    setStep("device");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitPassword) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithPassword({
        email: email.trim(),
        password,
        audience,
        role: effectiveRole,
      });

      if (result.needsDeviceOtp) {
        moveToDeviceVerification(result.message, result.retryAfterSeconds || 60);
        return;
      }

      rememberLoggedInUser(result);
      saveStoredAuthRole(result.user?.role || effectiveRole);
      navigate(getRedirectPath(result.user?.role), { replace: true });
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (error instanceof Error ? error.message : "Invalid email or password. Please try again.");

      setFeedback({ message, tone: "error" });
      setShowForgotPwd(true); // Show forgot password when login fails
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDevice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitOtp) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await verifyDeviceOtp({
        email: email.trim(),
        otp: otp.trim(),
      });

      rememberLoggedInUser(result);
      saveStoredAuthRole(result.user?.role || effectiveRole);
      navigate(getRedirectPath(result.user?.role), { replace: true });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Device verification failed. Please try again.";

      setFeedback({ message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!isEmailValid || isResendingOtp || otpCooldownSeconds > 0) return;

    setFeedback(null);
    setIsResendingOtp(true);

    try {
      const result = await resendDeviceOtp(email.trim());
      setOtpCooldownSeconds(60);
      setFeedback({ message: result.message || "OTP sent successfully.", tone: "info" });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Could not resend the OTP. Please try again.";

      setOtpCooldownSeconds(getRetryAfterSeconds(error));
      setFeedback({ message, tone: "error" });
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleGoogleContinue = () => {
    saveStoredAuthRole(effectiveRole);
    window.location.assign(
      getGoogleAuthUrl({
        audience,
        role: effectiveRole,
      })
    );
  };

  return (
    <section className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <motion.form
            key="email-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onSubmit={handleLogin}
            className="flex flex-col gap-6 w-full max-w-[420px]"
          >
            <div className="grid gap-6">
              <AuthCardHeader title={stepCopy.title} subtitle={stepCopy.subtitle} />

              {showRoleSwitcher ? (
                <RoleSwitcher
                  value={selectedUserRole}
                  onChange={(nextRole) => {
                    setRole(nextRole);
                    setFeedback(null);
                  }}
                />
              ) : null}

              <GoogleActionButton onClick={handleGoogleContinue} />

              <OrDivider />

              <FieldGroup label="Enter Email">
                <IconInput
                  autoCapitalize="none"
                  autoComplete="email"
                  icon={Mail}
                  inputClassName="h-[52px] sm:h-[56px]"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email / Student ID"
                  spellCheck={false}
                  type="email"
                  value={email}
                />
              </FieldGroup>

              <FieldGroup label="Enter Password">
                <IconInput
                  autoCapitalize="none"
                  autoComplete="current-password"
                  icon={LockKeyhole}
                  inputClassName="h-[52px] sm:h-[56px] pr-12"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  rightAdornment={
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
              </FieldGroup>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-3 text-[13px] text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 appearance-none rounded border border-white/[0.2] bg-[#1a1a1a] checked:border-[#00E590] checked:bg-[#00E590] focus:ring-[#00E590]/50 focus:ring-offset-0 focus:outline-none transition-colors"
                    defaultChecked
                  />
                  Remember me
                </label>
                {showForgotPwd && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={isResetting}
                    className="text-[13px] font-medium text-emerald-500 hover:text-emerald-400 hover:underline disabled:opacity-50"
                  >
                    {isResetting ? "Sending..." : "Forgot Password?"}
                  </button>
                )}
              </div>

              {feedback ? <FeedbackMessage {...feedback} /> : null}

              <PrimaryActionButton
                disabled={!isEmailValid || !password || isSubmitting}
                label={isSubmitting ? "Signing In..." : "Sign In"}
                type="submit"
                className="mt-2 bg-gradient-to-r from-[#00E590] to-[#00C279] text-black shadow-[0_0_20px_rgba(0,229,144,0.3)] hover:brightness-110 hover:-translate-y-0.5 border-0 font-bold"
              />
            </div>

            <TermsText className="pt-2" variant="sentence" />

          </motion.form>
        ) : step === "device" ? (
          <motion.form
            key="device-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onSubmit={handleVerifyDevice}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-6">
              <Button
                type="button"
                variant="ghost"
                className="w-fit px-0 text-sm text-foreground hover:bg-transparent hover:text-primary"
                onClick={handleBack}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </Button>

              <AuthCardHeader title={stepCopy.title} subtitle={stepCopy.subtitle} />

              <FieldGroup label="Email">
                <div className="border border-border bg-background px-4 py-3 text-sm font-medium text-foreground">
                  {email.trim()}
                </div>
              </FieldGroup>

              <FieldGroup label="Verification Code">
                <IconInput
                  autoComplete="one-time-code"
                  icon={LockKeyhole}
                  inputClassName="h-12 border-border bg-background pl-11 sm:h-13"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  type="text"
                  value={otp}
                />
              </FieldGroup>

              {feedback ? <FeedbackMessage {...feedback} /> : null}

              <PrimaryActionButton
                disabled={!canSubmitOtp}
                label={isSubmitting ? "Verifying..." : "Verify Device"}
                type="submit"
              />

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full justify-center text-sm sm:h-13"
                disabled={isResendingOtp || otpCooldownSeconds > 0}
                onClick={handleResendOtp}
              >
                {isResendingOtp
                  ? "Sending..."
                  : otpCooldownSeconds > 0
                    ? `Resend Code in ${otpCooldownSeconds}s`
                    : "Resend Code"}
              </Button>

              <p className="text-center text-sm text-muted-foreground" aria-live="polite">
                {otpCooldownSeconds > 0
                  ? `You can request a new code in ${otpCooldownSeconds}s.`
                  : "You can request a new code now."}
              </p>
            </div>

            <TermsText className="pt-2" variant="compact" />
          </motion.form>
        ) : (
          <motion.form
            key="password-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onSubmit={handleLogin}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-6">
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-emerald-400"
                onClick={handleBack}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </button>

              <AuthCardHeader title={stepCopy.title} subtitle={stepCopy.subtitle} />

              <FieldGroup label="Email">
                <div className="flex h-[58px] w-full items-center rounded-[14px] border border-white/[0.14] bg-[#111111] px-4 text-sm text-[#ededed]">
                  {email.trim()}
                </div>
              </FieldGroup>

              <FieldGroup label="Enter Password">
                <IconInput
                  autoCapitalize="none"
                  autoComplete="current-password"
                  icon={LockKeyhole}
                  inputClassName="pr-12"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  rightAdornment={
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
              </FieldGroup>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/[0.14] bg-transparent text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
                    defaultChecked
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-emerald-500 hover:text-emerald-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {feedback ? <FeedbackMessage {...feedback} /> : null}

              <PrimaryActionButton
                disabled={!canSubmitPassword}
                label={isSubmitting ? "Logging in..." : "Login"}
                type="submit"
              />
            </div>

            <TermsText className="pt-2" variant="compact" />

          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

function getEffectiveRole(
  audience: AuthAudience,
  selectedRole: AuthUserRole,
  rememberedRole?: AuthLoginRole | null
): AuthLoginRole {
  if (audience === "super_admin") return "super_admin";
  if (audience === "admin") {
    return isInstitutionAdminRole(rememberedRole) ? rememberedRole : "org_admin";
  }

  return selectedRole;
}

function getRetryAfterSeconds(error: unknown) {
  if (!error || typeof error !== "object" || !("retryAfterSeconds" in error)) return 60;

  const value = Number(error.retryAfterSeconds);
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 60;
}

function getStepCopy({
  audience,
  branding,
  lockedRole,
  preferredRole,
  rememberedRole,
  step,
}: {
  audience: AuthAudience;
  branding: AuthBranding;
  lockedRole?: AuthUserRole | null;
  preferredRole?: AuthUserRole | null;
  rememberedRole?: AuthLoginRole | null;
  step: AuthStep;
}) {
  if (step === "device") {
    return {
      title: "Verify this device",
      subtitle: "Enter the one-time code sent to your registered email.",
    };
  }

  if (audience === "super_admin") {
    return {
      title: "Super Admin Portal",
      subtitle: "Secure access for Classgrid platform operators.",
    };
  }

  if (audience === "admin") {
    if (isInstitutionAdminRole(rememberedRole)) {
      return {
        title: `Welcome back, ${getRoleLabel(rememberedRole)}`,
        subtitle: `Continue to the ${getPortalLabel(rememberedRole)} for ${branding.name}.`,
      };
    }

    return {
      title: "Admin Portal",
      subtitle: `Shared access for organization and department administrators at ${branding.name}.`,
    };
  }

  if (lockedRole) {
    return {
      title: `${getRoleLabel(lockedRole)} Sign In`,
      subtitle: `This session is locked to the ${getPortalLabel(lockedRole).toLowerCase()}.`,
    };
  }
  return {
    title: "Welcome back!",
    subtitle: "Sign in to continue to your Classgrid portal",
  };
}

function AuthCardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 grid gap-1.5 text-center">
      <h2 className="text-[17px] font-semibold text-white">{title}</h2>
      {subtitle ? <p className="text-[14px] leading-5 text-white/55">{subtitle}</p> : null}
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 text-left text-sm font-medium">
      {/* Hide label visually since design uses placeholders, but keep for screen readers if needed. Alternatively just render children. */}
      {children}
    </div>
  );
}

function RoleSwitcher({
  value,
  onChange,
}: {
  value: AuthUserRole;
  onChange: (value: AuthUserRole) => void;
}) {
  return (
    <div className="flex w-full items-center gap-4 pb-2">
      {roleOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-[42px] flex-1 items-center justify-center gap-2 rounded-full border text-[13px] font-medium transition-all duration-200",
              isActive && option.value === "student"
                ? "border-[#00E590] text-[#00E590] bg-[#00E590]/5 shadow-[0_0_15px_rgba(0,229,144,0.1)]"
                : isActive && option.value === "teacher"
                ? "border-orange-500 text-orange-400 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                : "border-white/[0.08] bg-transparent text-white/55 hover:border-white/[0.15] hover:text-[#ededed]"
            )}
            aria-pressed={isActive}
          >
            <Icon className="size-[16px]" strokeWidth={2.5} aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function IconInput({
  icon: Icon,
  value,
  onChange,
  type,
  placeholder,
  inputClassName,
  rightAdornment,
  ...rest
}: {
  icon: typeof Mail;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type: string;
  placeholder: string;
  inputClassName?: string;
  rightAdornment?: ReactNode;
} & Omit<React.ComponentProps<"input">, "className" | "onChange" | "placeholder" | "type" | "value">) {
  return (
    <div className="relative w-full">
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/45" aria-hidden="true" />
      <input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className={cn(
          "h-[58px] w-full rounded-[14px] border border-white/[0.14] bg-transparent pl-11 pr-4 text-sm text-[#ededed] placeholder:text-white/45 outline-none transition-colors focus:border-emerald-500/50",
          inputClassName
        )}
        {...rest}
      />
      {rightAdornment}
    </div>
  );
}

function PrimaryActionButton({
  label,
  disabled,
  type,
}: {
  label: string;
  disabled: boolean;
  type: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="flex h-[60px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function GoogleActionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-[56px] w-full items-center justify-center gap-3 rounded-[14px] border border-white/[0.14] bg-transparent text-sm font-medium text-[#ededed] transition-colors hover:bg-white/[0.04]"
      onClick={onClick}
    >
      <img
        src="https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/google.svg"
        alt="Google"
        className="size-[18px]"
      />
      Continue with Google
    </button>
  );
}

function OrDivider() {
  return (
    <div className="flex w-full items-center gap-4 text-xs tracking-wider text-white/45">
      <div className="flex-1 border-t border-white/[0.08]" />
      <span className="uppercase">Or</span>
      <div className="flex-1 border-t border-white/[0.08]" />
    </div>
  );
}

function FeedbackMessage({
  message,
  tone,
}: {
  message: string;
  tone: MessageTone;
}) {
  return (
    <div
      aria-live="polite"
      className={`rounded-[14px] border px-4 py-3 text-[13px] leading-6 ${
        tone === "error"
          ? "border-red-500/35 bg-red-500/10 text-[#fecaca]"
          : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {message}
    </div>
  );
}

function TermsText({
  variant,
  className,
}: {
  variant: "sentence" | "compact";
  className?: string;
}) {
  return (
    <p className={cn("text-center text-[12px] leading-6 text-white/55", className)}>
      By signing in, you agree to our{" "}
      <a href="https://classgrid.in/terms" target="_blank" rel="noopener noreferrer" className="text-[#00E590] hover:underline">
        Terms &amp; Privacy Policy
      </a>
    </p>
  );
}

