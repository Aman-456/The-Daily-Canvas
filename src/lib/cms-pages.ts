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
<p>An editorial blog for stories, guides, and ideas. Browse the home page, archive, or search by title; narrow with topic filters where available.</p>
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

<h2>2026-04-16 — Performance: faster header + article pages</h2>

<h3>Performance</h3>
<ul>
<li>Public layout no longer fetches server session for the header; session UI hydrates on the client with a small skeleton fallback.</li>
<li>Removed <code>force-dynamic</code> from cacheable public listing pages where safe (home, search, archive, topics, author pages) to enable better caching behavior.</li>
<li>Article detail pages no longer fetch <code>auth()</code> during SSR; vote/report UI hydrates on the client.</li>
</ul>

<h3>Engagement</h3>
<ul>
<li>When logged out, vote and report/flag controls are hidden on articles and comments.</li>
</ul>

<h2>2026-04-11 — Comments: Reddit-style thread &amp; deferred load</h2>

<h3>Reading &amp; comments</h3>
<ul>
<li>Blog post comments use a <strong>Reddit-style</strong> layout: thread header and count, <strong>composer first</strong> (signed-in users post; guests see a disabled box plus <strong>Log in to comment</strong>).</li>
<li>The <strong>first page of comments loads when you scroll near</strong> the section (not on every page load), keeping long articles lighter until readers reach the thread.</li>
<li>Inline <strong>Reply</strong> on each comment; guests get the same pattern with <strong>Log in to reply</strong>.</li>
<li>Shared comment types live in <code>src/types/comment.ts</code>; thread UI is split into focused components under <code>src/components/client/comments/</code> with small hooks for viewport detection and pagination.</li>
</ul>

<h2>2026-04-09 — Admin layout cleanup &amp; dead code removal</h2>

<h3>Admin</h3>
<ul>
<li>Shared list layout: <code>AdminListPageShell</code>, <code>AdminPageHeader</code>, <code>AdminToolbarCard</code>, and compact toolbar counts (<code>AdminToolbarCount</code>) so admin list pages stay consistent.</li>
<li>Blogs, comments, users, newsletter, cache, and other list screens wired into the same shell/toolbar patterns; blog list/detail/edit screens cleaned up.</li>
<li>Toolbar totals use muted inline text (same idea as the blogs list) instead of wide primary-tint badges.</li>
<li>Contact inbox: status filtering uses a <strong>dropdown</strong> like other admin lists.</li>
<li>Manage Pages admin route markup fixed; tables use predictable overflow behavior.</li>
<li>Admin filter/search controls (<code>AdminFilters</code>, <code>AdminSearch</code>) adjusted for the new layouts.</li>
</ul>

<h3>Reading &amp; markdown</h3>
<ul>
<li>Blog post body (<code>MarkdownWithToc</code>): GitHub-style <strong>tables</strong> get a scrollable wrapper and cell borders so wide data doesn’t break the column.</li>
<li>Markdown <strong>external</strong> links (<code>http(s)</code>, <code>mailto</code>, <code>tel</code>) open in a new tab with <code>noopener</code> / <code>noreferrer</code>; in-page <code>#anchors</code> stay same-tab.</li>
<li>Markdown images with <strong>remote</strong> URLs render as plain <code>&lt;img&gt;</code> (lazy, <code>no-referrer</code>) so Next/Image optimizer edge cases—redirects, blocks, hotlink rules—don’t blank the post.</li>
<li>Article <strong>cover</strong> images use the same plain <code>&lt;img&gt;</code> approach for reliable delivery from external hosts.</li>
</ul>

<h3>Code health</h3>
<ul>
<li>Removed unused <code>SpotlightCarousel</code>, unused <code>BlogPostCardGrid</code> component (type <code>BlogPostCardItem</code> now lives in <code>src/types/blog-post-card.ts</code>), unused UI sheet primitive, and a duplicate session-provider file.</li>
<li>Scripts: single changelog sync (<code>scripts/sync-changelog-from-default.ts</code> via <code>npm run db:sync-changelog</code>); removed duplicate <code>sync-changelog-default-to-db.ts</code> and unused <code>upload-anime-covers-to-blob.ts</code>.</li>
<li>Production build verified.</li>
</ul>

<h2>2026-04-08 — Admin user roles</h2>

<h3>Admin</h3>
<ul>
<li>On <strong>Users</strong>, administrators can change the role (USER / ADMIN) for <strong>other administrators</strong>, not only regular users. The role control stays disabled on your own row; demoting the last remaining administrator is blocked.</li>
</ul>

<h3>Performance &amp; accessibility</h3>
<ul>
<li>Improved image delivery on listing cards (archive, grids, and featured rails) by lowering non-hero image quality and ensuring consistent <code>alt</code> text.</li>
<li>Fixed mobile tap-target sizing for topic pills on archive cards.</li>
<li>Adjusted footer heading levels to keep headings in sequential order for assistive technologies.</li>
<li>Deferred loading the comments UI on blog pages to reduce main-thread work during initial render.</li>
<li>JSON-LD now renders via a plain <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> tag (removes React “script tag” warnings while preserving structured data).</li>
</ul>

<h2>2026-04-07 — Sign-in page &amp; email login</h2>

<h3>Auth</h3>
<ul>
<li>Email and password sign-in (Credentials) is available in production whenever <code>DEV_ADMIN_EMAIL</code> and <code>DEV_ADMIN_PASSWORD</code> are set—same behavior as local development.</li>
<li>Google sign-in on <code>/signin</code> uses the client <code>signIn(&quot;google&quot;, …)</code> flow (Auth.js v5). A plain link to <code>GET /api/auth/signin/google</code> is not supported and previously led to a generic configuration error.</li>
<li>Copy on <code>/signin</code> reflects production email login and how to configure it.</li>
<li>Users marked <strong>disabled</strong> in Admin cannot sign in (Google or email/password); existing sessions are cleared when a session is checked.</li>
<li>Failed sign-in on <code>/signin</code> shows inline and query-string errors (including OAuth); credentials failures no longer send you to the home page without a message.</li>
<li>Disabled accounts using email/password see an explicit “account has been disabled” message instead of a generic invalid-password hint.</li>
<li>The sign-in page shows a short “Loading sign-in options…” state while provider metadata loads, so the “email sign-in is not configured” message does not flash briefly when credentials are enabled.</li>
<li>Docs: troubleshooting for OAuth <code>error=Configuration</code> (env, callback URIs, and not using a GET link to start Google sign-in).</li>
</ul>

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

<h3>Home</h3>
<ul>
<li>Featured stories now use a swipeable carousel on mobile with pagination dots, looping, autoplay, and improved dark-mode styling.</li>
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
