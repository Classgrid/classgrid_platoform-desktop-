import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

import { requestPasswordReset } from "../api";
import { LeftPanel } from "../components/LeftPanel";

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
              <h1 className="font-heading text-[1.9rem] font-semibold leading-tight text-foreground">Reset password</h1>
              <p className="text-sm leading-6 text-muted-foreground">Enter your account email and we will send a secure reset link.</p>
            </div>

            <label className="grid gap-2 text-left text-sm font-medium text-foreground">
              <span>Email</span>
              <div className="relative w-full">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  autoCapitalize="none"
                  autoComplete="email"
                  className="h-12 border-border bg-background pl-11 sm:h-13"
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  spellCheck={false}
                  type="email"
                  value={email}
                />
              </div>
            </label>

            {feedback ? <FeedbackMessage {...feedback} /> : null}

            <Button type="submit" disabled={!isEmailValid || isSubmitting} className="h-12 w-full justify-between px-4 text-sm sm:h-13">
              <span>{isSubmitting ? "Sending..." : "Send reset link"}</span>
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </section>
    </main>
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
