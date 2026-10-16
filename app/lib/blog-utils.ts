export type Blog = {
  _id: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  slug: string;
  postingDateTime: string | null;
  createdAt: string | null;
};

export function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Quill emits <p><br></p> for blank lines, which renders as huge gaps.
// Collapse consecutive empty paragraphs like the source site does.
export function normalizeQuillHtml(html: string) {
  if (!html) return "";
  const emptyPara = "<p>\\s*(?:<br\\s*\\/?\\s*>|&nbsp;|\\s)*\\s*<\\/p>";
  let out = html;
  out = out.replace(new RegExp(`^(\\s*${emptyPara}\\s*)+`, "i"), "");
  out = out.replace(new RegExp(`(\\s*${emptyPara}\\s*)+$`, "i"), "");
  out = out.replace(
    new RegExp(`(\\s*${emptyPara}\\s*){2,}`, "gi"),
    "<p><br /></p>",
  );
  return out.trim();
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
