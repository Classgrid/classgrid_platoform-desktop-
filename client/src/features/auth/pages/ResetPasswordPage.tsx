import { type FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";

import { resetPasswordWithToken } from "../api";

const CLASSGRID_LOGO =
  "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png";

/* ── Password validation rules ── */
const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  { label: "One special character (@$!%*?&)", test: (p: string) => /[@$!%*?&]/.test(p) },
];

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "info" } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const allRulesPassed = useMemo(() => strongPassword.test(password), [password]);
  const passwordsMatch = useMemo(() => password === confirmPassword && confirmPassword.length > 0, [password, confirmPassword]);
  const canSubmit = !!token && allRulesPassed && passwordsMatch && !isSubmitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      await resetPasswordWithToken({ token, password });
      setPassword("");
      setConfirmPassword("");
      setIsSuccess(true);
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

  /* ── SUCCESS STATE — Big tick mark ── */
  if (isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "#111111" }}>
        <div className="flex w-full max-w-[400px] flex-col items-center justify-center rounded-[24px] border border-white/[0.15] bg-[#0f0f0f] px-7 py-12 shadow-xl">
          {/* Animated tick circle */}
          <div
            className="flex h-[100px] w-[100px] items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)",
              border: "2px solid rgba(16,185,129,0.4)",
              animation: "scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          >
            <Check
              className="h-[48px] w-[48px] text-[#10b981]"
              strokeWidth={3}
              style={{ animation: "fadeIn 0.4s ease 0.3s both" }}
            />
          </div>

          <p
            className="mt-5 text-[18px] font-semibold text-[#ededed]"
            style={{ animation: "fadeIn 0.4s ease 0.5s both" }}
          >
            Password Set
          </p>
        </div>

        <style>{`
          @keyframes scaleIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>
      </main>
    );
  }

  /* ── FORM STATE ── */
  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "#111111" }}>
      <div className="flex w-full max-w-[400px] flex-col rounded-[24px] border border-white/[0.15] bg-[#0f0f0f] px-7 py-6 shadow-xl">
        {/* Logo */}
        <img
          src={CLASSGRID_LOGO}
          alt="Classgrid"
          className="mx-auto h-[56px] w-[56px] object-contain"
        />

        {/* Header */}
        <h1 className="mt-4 text-center text-[24px] font-bold text-[#ededed]">
          Reset Your Password
        </h1>

        {/* No token error */}
        {!token && (
          <div className="mt-6 rounded-[12px] border border-red-500/35 bg-red-500/10 px-4 py-3 text-[13px] leading-5 text-red-200">
            This reset link is missing a token. Please request a new reset link.
          </div>
        )}

        {token && (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
            {/* New Password */}
            <label className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
              New Password
            </label>
            <div className="mt-1.5 flex h-[44px] items-center gap-3 rounded-[12px] border border-white/[0.14] bg-[#141414] px-4">
              <Lock className="h-[18px] w-[18px] shrink-0 text-white/70" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-[14px] text-[#ededed] outline-none placeholder:text-white/40"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 text-white/70 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>

            {/* Password Strength Rules */}
            {password.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {rules.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      {passed ? (
                        <Check className="h-[14px] w-[14px] text-[#10b981]" />
                      ) : (
                        <X className="h-[14px] w-[14px] text-red-400" />
                      )}
                      <span className={`text-[12px] ${passed ? "text-[#10b981]" : "text-red-300"}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm Password */}
            <label className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-white/50">
              Confirm Password
            </label>
            <div className="mt-1.5 flex h-[44px] items-center gap-3 rounded-[12px] border border-white/[0.14] bg-[#141414] px-4">
              <Lock className="h-[18px] w-[18px] shrink-0 text-white/70" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent text-[14px] text-[#ededed] outline-none placeholder:text-white/40"
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="shrink-0 text-white/70 transition-colors hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>

            {/* Confirm match indicator */}
            {confirmPassword.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                {passwordsMatch ? (
                  <>
                    <Check className="h-[14px] w-[14px] text-[#10b981]" />
                    <span className="text-[12px] text-[#10b981]">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="h-[14px] w-[14px] text-red-400" />
                    <span className="text-[12px] text-red-300">Passwords do not match</span>
                  </>
                )}
              </div>
            )}

            {/* Error feedback */}
            {feedback && (
              <div
                className={`mt-4 rounded-[12px] border px-3 py-2 text-[12px] leading-5 ${
                  feedback.tone === "error"
                    ? "border-red-500/35 bg-red-500/10 text-red-200"
                    : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Submit Button */}
            <button
               type="submit"
               disabled={!canSubmit}
               className="mt-5 h-[46px] w-full rounded-[12px] bg-[#10b981] text-[15px] font-bold text-white transition-colors hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
