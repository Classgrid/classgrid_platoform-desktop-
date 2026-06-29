import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

import { requestPasswordReset } from "../api";
import { LoginPageShell } from "../components/backend_login_archive/LoginPageShell";
import { LeftPanelClassgrid } from "../components/backend_login_archive/LeftPanelClassgrid";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "info" } | null>(null);

  const isEmailValid = emailPattern.test(email.trim());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEmailValid || isSubmitting) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email.trim());
      setFeedback({
        message: result.message || "If that email is registered, a password reset link has been sent.",
        tone: "info",
      });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Could not send a reset link right now.";

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
          <h1 className="text-3xl font-bold text-[#ededed]">Reset password</h1>
          <p className="text-sm leading-6 text-white/55">
            Enter your account email and we will send a secure reset link. The link expires in 5 minutes.
          </p>
        </div>

        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#ededed]">Email</label>
          <div className="relative w-full">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/45"
              aria-hidden="true"
            />
            <input
              autoCapitalize="none"
              autoComplete="email"
              className="h-[58px] w-full rounded-[14px] border border-white/[0.14] bg-[#111111] pl-11 pr-4 text-sm text-[#ededed] placeholder:text-white/45 outline-none transition-colors focus:border-emerald-500/50"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              spellCheck={false}
              type="email"
              value={email}
            />
          </div>
        </div>

        {/* Feedback */}
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
          disabled={!isEmailValid || isSubmitting}
          className="flex h-[60px] w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
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
