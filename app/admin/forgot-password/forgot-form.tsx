"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword } from "../../actions/auth";

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

const buttonClass =
  "w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

export default function ForgotPasswordForm() {
  const [forgotState, forgotAction, forgotPending] = useActionState(
    requestPasswordReset,
    undefined,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetPassword,
    undefined,
  );

  const step = resetState?.success
    ? "done"
    : forgotState?.sent
      ? "reset"
      : "email";

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Reset Password
      </h1>

      {step === "email" && (
        <>
          <p className="mt-2 text-sm text-zinc-600">
            Enter your admin email and we&apos;ll send you a 6-digit reset code.
          </p>
          <form action={forgotAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@example.com"
                className={inputClass}
              />
            </div>

            {forgotState?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {forgotState.error}
              </p>
            )}

            <button type="submit" disabled={forgotPending} className={buttonClass}>
              {forgotPending ? "Sending code…" : "Send reset code"}
            </button>
          </form>
        </>
      )}

      {step === "reset" && (
        <>
          <p className="mt-2 text-sm text-zinc-600">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-zinc-900">
              {forgotState?.email}
            </span>{" "}
            and choose a new password.
          </p>
          <form action={resetAction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-zinc-700"
              >
                Email
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={forgotState?.email}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-zinc-700"
              >
                Reset code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder="123456"
                className={`${inputClass} tracking-[0.3em]`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700"
              >
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-zinc-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {resetState?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {resetState.error}
              </p>
            )}

            <button type="submit" disabled={resetPending} className={buttonClass}>
              {resetPending ? "Updating…" : "Reset password"}
            </button>

            <button
              type="submit"
              formAction={forgotAction}
              formNoValidate
              disabled={forgotPending}
              className="w-full text-center text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-60"
            >
              {forgotPending ? "Sending…" : "Resend code"}
            </button>
          </form>
        </>
      )}

      {step === "done" && (
        <div className="mt-6">
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Your password has been updated. You can now sign in with your new
            password.
          </p>
          <Link
            href="/admin"
            className={`${buttonClass} mt-4 block text-center`}
          >
            Back to sign in
          </Link>
        </div>
      )}

      {step !== "done" && (
        <p className="mt-6 text-center text-sm text-zinc-600">
          Remembered it?{" "}
          <Link
            href="/admin"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Back to sign in
          </Link>
        </p>
      )}
    </div>
  );
}
