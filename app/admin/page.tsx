import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "../lib/session";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Admin | Property Karobari",
};

// This page reads the session cookie + database on every request.
export const instant = false;

export default async function AdminPage() {
  const session = await getSession();

  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <LoginForm />
    </main>
  );
}
