import type { PostType } from "@/generated/prisma/enums";
import { adminInput, adminLabel, adminLabelText, adminBtn } from "@/lib/admin-ui";

type PostDefaults = {
  title: string;
  slug: string;
  author: string;
  coverImage: string | null;
  excerpt: string | null;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  type: PostType;
  listed: boolean;
  sponsored: boolean;
  noindex: boolean;
  published: boolean;
};

const EMPTY: PostDefaults = {
  title: "", slug: "", author: "", coverImage: null, excerpt: "", body: "",
  metaTitle: null, metaDescription: null, type: "ARTICLE", listed: true,
  sponsored: false, noindex: false, published: false,
};

const input = adminInput;
const labelWrap = adminLabel;
const hint = adminLabelText;

export function PostForm({
  action,
  submitLabel,
  post = EMPTY,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  post?: PostDefaults;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <label className={labelWrap}>
        <span className={hint}>Title</span>
        <input name="title" defaultValue={post.title} required className={input} />
      </label>

      <label className={labelWrap}>
        <span className={hint}>Author</span>
        <input name="author" defaultValue={post.author} required className={input} />
      </label>

      <label className={labelWrap}>
        <span className={hint}>Cover Image URL (optional)</span>
        <input name="coverImage" type="url" defaultValue={post.coverImage ?? ""} className={input} />
      </label>

      <label className={labelWrap}>
        <span className={hint}>Body (Markdown)</span>
        <textarea name="body" defaultValue={post.body} required rows={14} className={input} />
      </label>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-3">
        <legend className="px-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-faint">SEO</legend>
        <label className={labelWrap}>
          <span className={hint}>Slug (optional - derived from title if blank)</span>
          <input name="slug" defaultValue={post.slug} className={input} placeholder="todays-football-prediction" />
        </label>
        <label className={labelWrap}>
          <span className={hint}>Excerpt / summary (optional)</span>
          <textarea name="excerpt" defaultValue={post.excerpt ?? ""} rows={2} className={input} />
        </label>
        <label className={labelWrap}>
          <span className={hint}>Meta title (optional)</span>
          <input name="metaTitle" defaultValue={post.metaTitle ?? ""} className={input} />
        </label>
        <label className={labelWrap}>
          <span className={hint}>Meta description (optional)</span>
          <textarea name="metaDescription" defaultValue={post.metaDescription ?? ""} rows={2} className={input} />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-3">
        <legend className="px-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-faint">Distribution</legend>
        <label className={labelWrap}>
          <span className={hint}>Type</span>
          <select name="type" defaultValue={post.type} className={input}>
            <option value="ARTICLE">Article (editorial)</option>
            <option value="GUEST">Guest / sponsored submission</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="listed" defaultChecked={post.listed} />
          Listed - show in the blog index, homepage, and as a normal sitemap entry
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sponsored" defaultChecked={post.sponsored} />
          Sponsored - show a disclosure banner and mark outbound links rel=&quot;sponsored nofollow&quot;
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="noindex" defaultChecked={post.noindex} />
          noindex - tell search engines not to index this page (also removed from sitemap)
        </label>
        <p className="text-xs text-muted">
          An unlisted post still has a working public URL at <code>/blog/&lt;slug&gt;</code> - it is
          just not surfaced in navigation or feeds.
        </p>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publish" defaultChecked={post.published} />
        Published
      </label>

      <button type="submit" className={adminBtn}>
        {submitLabel}
      </button>
    </form>
  );
}
