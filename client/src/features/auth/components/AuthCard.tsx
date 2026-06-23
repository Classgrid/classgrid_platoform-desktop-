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

import { checkEmailForLogin, getGoogleAuthUrl, loginWithPassword, resendDeviceOtp, verifyDeviceOtp } from "../api";
import {
  getPortalLabel,
  getRedirectPath,
  getRoleLabel,
  isInstitutionAdminRole,
  isUserRole,
  saveStoredAuthRole,
} from "../auth-helpers";
import type { AuthAudience, AuthBranding, AuthLoginRole, AuthUserRole } from "../types";

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
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(initialDeviceVerification ? 60 : 0);
  const [feedback, setFeedback] = useState<{ message: string; tone: MessageTone } | null>(
    initialMessage ? { message: initialMessage, tone: initialMessageTone } : null
  );

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
    } catch (error) {
      if (error && typeof error === "object" && "needsDeviceOtp" in error) {
        const message = "message" in error ? String(error.message) : undefined;
        moveToDeviceVerification(message, getRetryAfterSeconds(error));
        return;
      }

      const message =
        error && typeof error === "object" && "message" in error ? String(error.message) : "Login failed. Please try again.";

      setFeedback({ message, tone: "error" });
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
    <section className="w-full border border-border bg-card p-5 text-card-foreground sm:p-6 lg:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <motion.form
            key="email-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onSubmit={handleContinue}
            className="flex flex-col gap-6"
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

              <FieldGroup label="Enter Email">
                <IconInput
                  autoCapitalize="none"
                  autoComplete="email"
                  icon={Mail}
                  inputClassName="h-12 border-border bg-background pl-11 sm:h-13"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  spellCheck={false}
                  type="email"
                  value={email}
                />
              </FieldGroup>

              {feedback ? <FeedbackMessage {...feedback} /> : null}

              <PrimaryActionButton
                disabled={!isEmailValid || isSubmitting}
                label={isSubmitting ? "Checking..." : "Continue"}
                type="submit"
              />

              <OrDivider />

              <GoogleActionButton onClick={handleGoogleContinue} />
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

              <FieldGroup label="Enter Password">
                <IconInput
                  autoCapitalize="none"
                  autoComplete="current-password"
                  icon={LockKeyhole}
                  inputClassName="h-12 border-border bg-background pl-11 pr-12 sm:h-13"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  rightAdornment={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  }
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
              </FieldGroup>

              <Link to="/forgot-password" className="justify-self-start text-sm font-medium text-primary">
                Forgot Password?
              </Link>

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

  if (step === 1 && isUserRole(rememberedRole)) {
    return {
      title: `Welcome back, ${getRoleLabel(rememberedRole)}`,
      subtitle: `Use your institution email to continue to ${branding.name}.`,
    };
  }

  if (step === 1) {
    return {
      title: "Sign in",
      subtitle: "Choose Student or Faculty access and continue with your institution email.",
    };
  }

  return {
    title: isUserRole(rememberedRole)
      ? `Welcome back, ${getRoleLabel(rememberedRole)}`
      : preferredRole
        ? `${getRoleLabel(preferredRole)} Sign In`
        : "Welcome back",
    subtitle: `Enter your password to continue to ${branding.name}.`,
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
    <div className="grid gap-2 text-center lg:text-left">
      <h2 className="font-heading text-[1.9rem] font-semibold leading-tight text-foreground">{title}</h2>
      {subtitle ? <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
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
    <label className="grid gap-2 text-left text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
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
    <div className="grid grid-cols-2 gap-1 border border-border bg-background p-1">
      {roleOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-11 items-center justify-center gap-2 border px-3 text-sm font-medium transition-colors",
              isActive ? "border-primary bg-card text-foreground" : "border-transparent text-muted-foreground hover:border-border"
            )}
            aria-pressed={isActive}
          >
            <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
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
} & Omit<React.ComponentProps<typeof Input>, "className" | "onChange" | "placeholder" | "type" | "value">) {
  return (
    <div className="relative w-full">
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className={cn("w-full", inputClassName)}
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
    <Button type={type} disabled={disabled} className="h-12 w-full justify-between px-4 text-sm sm:h-13">
      <span>{label}</span>
      <ArrowRight className="size-5" aria-hidden="true" />
    </Button>
  );
}

function GoogleActionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full justify-center gap-3 text-sm sm:h-13"
      onClick={onClick}
    >
      <span className="inline-flex size-7 items-center justify-center border border-border text-sm font-semibold text-foreground">
        G
      </span>
      Continue with Google
    </Button>
  );
}

function OrDivider() {
  return (
    <div className="flex w-full items-center gap-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      <Separator className="flex-1" />
      <span>Or</span>
      <Separator className="flex-1" />
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
      className={cn(
        "border px-4 py-3 text-sm leading-6",
        tone === "error" ? "border-destructive bg-destructive/10 text-destructive" : "border-primary bg-primary/10 text-foreground"
      )}
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
  if (variant === "compact") {
    return (
      <p className={cn("text-center text-[13px] leading-6 text-muted-foreground", className)}>
        <Link to="/terms" className="font-medium text-primary">
          Terms
        </Link>{" | "}
        <Link to="/privacy-policy" className="font-medium text-primary">
          Privacy Policy
        </Link>
      </p>
    );
  }

  return (
    <p className={cn("text-center text-[13px] leading-6 text-muted-foreground", className)}>
      By continuing, you agree to Classgrid{" "}
      <Link to="/terms" className="font-medium text-primary">
        Terms
      </Link>{" "}
      and{" "}
      <Link to="/privacy-policy" className="font-medium text-primary">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
