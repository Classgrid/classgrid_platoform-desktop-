import { type FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";

import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { cn } from "@/lib/utils";

import { resetPasswordWithToken } from "../api";
import { LeftPanel } from "../components/LeftPanel";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "info" } | null>(null);

  const validationMessage = useMemo(() => {
    if (!token) return "This reset link is missing a token. Please request a new reset link.";
    if (!password) return null;
    if (!strongPassword.test(password)) {
      return "Use at least 8 characters with uppercase, lowercase, number, and special character.";
    }
    if (confirmPassword && password !== confirmPassword) return "Passwords do not match.";
    return null;
  }, [confirmPassword, password, token]);

  const canSubmit = !!token && strongPassword.test(password) && password === confirmPassword && !isSubmitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await resetPasswordWithToken({ token, password });
      setPassword("");
      setConfirmPassword("");
      setFeedback({ message: result.message || "Password reset successful. You can now log in.", tone: "info" });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Could not reset password right now.";

      setFeedback({ message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-container bg-background text-foreground">
      <LeftPanel />
      <section className="right-panel px-4 py-2 sm:px-6 lg:px-8 xl:px-10">
        <form onSubmit={handleSubmit} className="w-full border border-border bg-card p-5 text-card-foreground sm:p-6 lg:p-8">
          <div className="grid gap-6">
            <Link to="/login" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to login
            </Link>

            <div className="grid gap-2">
              <h1 className="font-heading text-[1.9rem] font-semibold leading-tight text-foreground">Create new password</h1>
              <p className="text-sm leading-6 text-muted-foreground">Set a secure password for your Classgrid account.</p>
            </div>

            <PasswordField
              label="New Password"
              onChange={setPassword}
              showPassword={showPassword}
              toggleShowPassword={() => setShowPassword((current) => !current)}
              value={password}
            />

            <PasswordField
              label="Confirm Password"
              onChange={setConfirmPassword}
              showPassword={showPassword}
              toggleShowPassword={() => setShowPassword((current) => !current)}
              value={confirmPassword}
            />

            {validationMessage ? <FeedbackMessage message={validationMessage} tone="error" /> : null}
            {feedback ? <FeedbackMessage {...feedback} /> : null}

            <Button type="submit" disabled={!canSubmit} className="h-12 w-full justify-between px-4 text-sm sm:h-13">
              <span>{isSubmitting ? "Updating..." : "Update password"}</span>
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

function PasswordField({
  label,
  onChange,
  showPassword,
  toggleShowPassword,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-left text-sm font-medium text-foreground">
      <span>{label}</span>
      <div className="relative w-full">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          autoCapitalize="none"
          autoComplete="new-password"
          className="h-12 border-border bg-background pl-11 pr-12 sm:h-13"
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          type={showPassword ? "text" : "password"}
          value={value}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={toggleShowPassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </label>
  );
}

function FeedbackMessage({ message, tone }: { message: string; tone: "error" | "info" }) {
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
