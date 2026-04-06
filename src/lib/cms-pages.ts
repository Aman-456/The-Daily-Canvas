/** Slugs backed by the `pages` table + admin editor. */
export const CMS_MANAGED_PAGE_SLUGS = [
	"privacy-policy",
	"terms-of-service",
	"faq",
	"changelog",
] as const;

export type CmsManagedPageSlug = (typeof CMS_MANAGED_PAGE_SLUGS)[number];

const FAQ_DEFAULT_BODY = `<p>Quick answers about reading and using the site. Edit this page in <strong>Admin → Manage Pages → FAQ</strong>.</p>

<details>
<summary>What is Daily Thoughts?</summary>
<p>An editorial blog for essays, stories, and ideas. Browse the home page, archive, or search by title; narrow with topic filters where available.</p>
</details>

<details>
<summary>How do topic filters work?</summary>
<p>When you pick multiple topics, posts must match every selected tag (AND logic). Use the clear link under the filters to reset.</p>
</details>

<details>
<summary>How do I follow new posts?</summary>
<p>Use the newsletter signup on the site, or subscribe to the RSS feed at <code>/feed.xml</code> in your reader.</p>
</details>

<details>
<summary>Can I comment?</summary>
<p>If comments are enabled on a post, sign in to join the discussion. See our community guidelines for expectations.</p>
</details>

<details>
<summary>Who writes here?</summary>
<p>Contributors publish under their byline on each article. For pitches or press, use the contact page.</p>
</details>`;

const CHANGELOG_DEFAULT_BODY = `<p>Notable updates to the site and reading experience. Edit this page in <strong>Admin → Manage Pages → Changelog</strong>. Use one <code>&lt;h2&gt;</code> per release (date and title); optional <code>&lt;h3&gt;</code> subheadings group related bullets inside that release.</p>

<h2>2026-04-06 — Reading &amp; sign-in polish</h2>

<h3>Auth</h3>
<ul>
<li>Mobile header now shows Sign in (previously hidden on small screens).</li>
<li>Sign in links route through <code>/signin</code> with an explicit <code>callbackUrl</code> to return you to the page you started from.</li>
<li><code>/signin</code> now defaults to returning to the home page when no <code>callbackUrl</code> is provided; admin redirects include <code>callbackUrl=/admin</code>.</li>
</ul>

<h3>Admin</h3>
<ul>
<li>Users, blogs, and comments tables now support quick filtering and sorting to speed up moderation and management.</li>
<li>Users can be marked Disabled/Enabled from the Users table (admin only).</li>
</ul>

<h3>Table of contents</h3>
<ul>
<li>Desktop TOC rail stays sticky while reading.</li>
<li>TOC clicks jump instantly (no smooth-scroll animation).</li>
<li>TOC items are auto-numbered when the heading text doesn’t already start with a number.</li>
</ul>

<h3>SEO</h3>
<ul>
<li>Upgraded blog post metadata with richer Open Graph + Twitter cards, absolute canonical URLs, and robots directives.</li>
<li>Improved auto-generated titles/descriptions to better reflect the post’s primary topic when custom SEO fields aren’t set.</li>
<li>Ensured images in related posts and markdown content have meaningful <code>alt</code> text; markdown images now render responsively.</li>
</ul>

<h2>2026-04-05 — Site update</h2>

<h3>Content &amp; admin</h3>
<ul>
<li>Added Changelog, FAQ, Community guidelines, and an RSS feed for published stories.</li>
<li>RSS: subscribe at <code>/feed.xml</code> in your reader of choice.</li>
<li>Contact inbox: clearer errors if the database is missing the submission <code>status</code> column; run <code>npm run db:migrate</code> or <code>npm run db:contact</code> on the same database as production.</li>
<li>Manage Pages editor: toolbar control to insert a <code>details</code> / <code>summary</code> accordion block (handy for FAQ-style entries).</li>
</ul>

<h3>Topics, archive &amp; sitemap</h3>
<ul>
<li>Multi-topic browsing uses path URLs like <code>/topics/pakistan/south-asia</code> (every segment is a topic; posts must match all of them). Segments are in a fixed, alphabetical order so each combination has one canonical link; old <code>?tag=</code> combinations on topic or archive pages redirect there.</li>
<li>Home and archive listings keep the same filters, but choosing several topics from the home teaser or archive now lands on those topic paths instead of the home URL with query params.</li>
<li>The public sitemap lists site pages only; the RSS feed stays discoverable via the site <code>&lt;link rel="alternate"&gt;</code> (not in the XML sitemap).</li>
</ul>

<h3>LLMs &amp; crawlers</h3>
<ul>
<li>Published <code>/llms.txt</code> (static file) with a short site overview, key paths, how multi-topic URLs work, and notes for crawlers and assistants—alongside <code>robots.txt</code>, not a replacement for it.</li>
</ul>`;

export function defaultCmsPage(
	slug: string,
): { title: string; content: string } | null {
	switch (slug) {
		case "privacy-policy":
			return {
				title: "Privacy Policy",
				content: `<h1>Privacy Policy</h1><p>This is the default content for the Privacy Policy. Please edit this page from the admin panel.</p>`,
			};
		case "terms-of-service":
			return {
				title: "Terms of Service",
				content: `<h1>Terms of Service</h1><p>This is the default content for the Terms of Service. Please edit this page from the admin panel.</p>`,
			};
		case "faq":
			return {
				title: "Frequently asked questions",
				content: FAQ_DEFAULT_BODY,
			};
		case "changelog":
			return {
				title: "Changelog",
				content: CHANGELOG_DEFAULT_BODY,
			};
		default:
			return null;
	}
}

/** Per-page cache tag for public <code>unstable_cache</code> wrappers. */
export function cmsPageCacheTag(slug: string): string | undefined {
	switch (slug) {
		case "privacy-policy":
			return "page-privacy-policy";
		case "terms-of-service":
			return "page-terms-of-service";
		case "faq":
			return "page-faq";
		case "changelog":
			return "page-changelog";
		default:
			return undefined;
	}
}

/** Long max-age for CMS HTML; admin save always busts via <code>revalidateTag</code>. */
export const CMS_PUBLIC_PAGE_REVALIDATE_SECONDS = 60 * 24 * 60 * 60; // 60 days
