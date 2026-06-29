import { type FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";

import { resetPasswordWithToken } from "../api";
import { LoginPageShell } from "../components/backend_login_archive/LoginPageShell";
import { LeftPanelClassgrid } from "../components/backend_login_archive/LeftPanelClassgrid";

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

  const rightPanel = (
    <div className="w-full max-w-[440px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Back to Login */}
        <Link
          to="/login"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to login
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-[#ededed]">Create new password</h1>
          <p className="text-sm leading-6 text-white/55">
            Set a secure password for your Classgrid account.
          </p>
        </div>

        {/* Password Inputs */}
        <div className="flex flex-col gap-4">
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
        </div>

        {/* Feedback Messages */}
        {validationMessage && (
          <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm leading-6 text-[#fecaca]">
            {validationMessage}
          </div>
        )}
        
        {feedback && (
          <div
            aria-live="polite"
            className={`rounded-xl px-4 py-3 text-sm leading-6 ${
              feedback.tone === "error"
                ? "border border-red-500/35 bg-red-500/10 text-[#fecaca]"
                : "border border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-[60px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );

  return (
    <LoginPageShell
      leftPanel={<LeftPanelClassgrid />}
      rightPanel={rightPanel}
    />
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
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#ededed]">{label}</label>
      <div className="relative w-full">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/45" aria-hidden="true" />
        <input
          autoCapitalize="none"
          autoComplete="new-password"
          className="h-[58px] w-full rounded-[14px] border border-white/[0.14] bg-[#111111] pl-11 pr-12 text-sm text-[#ededed] placeholder:text-white/45 outline-none transition-colors focus:border-emerald-500/50"
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          type={showPassword ? "text" : "password"}
          value={value}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/5 hover:text-white"
          onClick={toggleShowPassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
