import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/app/lib/admin-access";
import { getAllBlogs } from "@/app/lib/blogs";
import BlogManager from "./blog-manager";

export const metadata: Metadata = {
  title: "Blogs | Admin",
};

// Reads MongoDB at request time.
export const instant = false;

export default async function AdminBlogsPage() {
  if (!(await isSuperAdmin())) redirect("/admin/dashboard");
  const blogs = await getAllBlogs();
  return <BlogManager blogs={blogs} />;
}
