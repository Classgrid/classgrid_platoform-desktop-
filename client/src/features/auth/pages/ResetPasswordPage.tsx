import { type FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";

import { resetPasswordWithToken } from "../api";

const CLASSGRID_LOGO =
  "https://bumxgscngzjadyozdpce.supabase.co/storage/v1/object/public/LOGO%20AND%20%20SVG/android-chrome-512x512.png";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "info" } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordRules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      maxLength: password.length > 0 && password.length <= 64,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@#$%^&*!?_.\-]/.test(password),
    };
  }, [password]);

  const passedRules = Object.values(passwordRules).filter(Boolean).length;

  const strength = useMemo(() => {
    if (!password) return "empty";
    if (passedRules <= 3) return "weak";
    if (passedRules <= 5) return "medium";
    return "strong";
  }, [password, passedRules]);

  const isStrongPassword =
    passwordRules.minLength &&
    passwordRules.maxLength &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  const isConfirmTouched = confirmPassword.length > 0;
  const isPasswordMatch = password === confirmPassword && isConfirmTouched;

  const canSubmit = !!token && isStrongPassword && isPasswordMatch && !isSubmitting;

  const strengthStyles = {
    empty: {
      border: "border-white/10",
      glow: "",
      text: "text-gray-400",
      bar: "bg-white/10 w-0",
      label: "",
    },
    weak: {
      border: "border-red-500/70",
      glow: "shadow-[0_0_18px_rgba(239,68,68,0.20)]",
      text: "text-red-400",
      bar: "bg-red-500 w-1/3",
      label: "Weak password",
    },
    medium: {
      border: "border-orange-500/70",
      glow: "shadow-[0_0_18px_rgba(249,115,22,0.20)]",
      text: "text-orange-400",
      bar: "bg-orange-500 w-2/3",
      label: "Medium password",
    },
    strong: {
      border: "border-emerald-500/80",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      text: "text-emerald-400",
      bar: "bg-emerald-500 w-full",
      label: "Strong password",
    },
  };

  const current = strengthStyles[strength];

  const confirmBorder = !isConfirmTouched
    ? "border-white/10"
    : isPasswordMatch
    ? "border-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.22)]"
    : "border-red-500/70 shadow-[0_0_18px_rgba(239,68,68,0.20)]";

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

  if (isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "#111111" }}>
        <div className="flex w-full max-w-[430px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[#111111] px-7 py-12 shadow-2xl">
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

  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "#111111" }}>
      <div className="w-full max-w-[430px] rounded-[28px] border border-white/10 bg-[#111111] p-8 shadow-2xl">
        {/* Logo */}
        <img
          src={CLASSGRID_LOGO}
          alt="Classgrid"
          className="mx-auto h-[56px] w-[56px] object-contain"
        />

        <h1 className="mt-6 text-center text-3xl font-bold text-white">
          Reset Your Password
        </h1>

        {!token && (
          <div className="mt-6 rounded-[12px] border border-red-500/35 bg-red-500/10 px-4 py-3 text-[13px] leading-5 text-red-200">
            This reset link is missing a token. Please request a new reset link.
          </div>
        )}

        {token ? (
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(e); }} className="mt-8">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              New Password
            </label>

            <input
              type="password"
              value={password}
              maxLength={64}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className={`mt-3 h-14 w-full rounded-2xl border bg-[#111111] px-5 text-white outline-none transition-all duration-300 placeholder:text-gray-500 ${current.border} ${current.glow}`}
            />

            {password && (
              <>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${current.bar}`}
                  />
                </div>
              </>
            )}

            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                maxLength={64}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`mt-3 h-14 w-full rounded-2xl border bg-[#111111] px-5 text-white outline-none transition-all duration-300 placeholder:text-gray-500 ${confirmBorder}`}
              />

              {isConfirmTouched && (
                <p
                  className={`mt-2 text-sm font-semibold ${
                    isPasswordMatch ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPasswordMatch ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

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

            {/* Validation Error if they try to click update but it's weak */}
            {!isStrongPassword && password.length > 0 && (
              <p className="mt-4 text-[12px] text-red-400">
                Password must include uppercase, lowercase, number, and special character.
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-7 h-14 w-full rounded-2xl font-bold transition-all duration-300 ${
                canSubmit
                  ? "bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.28)] hover:bg-emerald-400"
                  : "cursor-not-allowed bg-emerald-700/60 text-gray-400"
              }`}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
