import type { Metadata } from "next";
import ForgotPasswordForm from "./forgot-form";

export const metadata: Metadata = {
  title: "Forgot Password | Property Kaarobaari",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <ForgotPasswordForm />
    </main>
  );
}
