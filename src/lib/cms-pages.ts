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

const CHANGELOG_DEFAULT_BODY = `<p>Notable updates to the site and reading experience. Edit this page in <strong>Admin → Manage Pages → Changelog</strong>. Use an <code>&lt;h2&gt;</code> per release (date and title), then a bullet list.</p>

<h2>2026-04-05 — Site expansion</h2>
<ul>
<li>Added Changelog, FAQ, Community guidelines, and an RSS feed for published stories.</li>
<li>RSS: subscribe at <code>/feed.xml</code> in your reader of choice.</li>
<li>Contact inbox: clearer errors if the database is missing the submission <code>status</code> column; run <code>npm run db:migrate</code> or <code>npm run db:contact</code> on the same database as production.</li>
<li>Manage Pages editor: toolbar control to insert a <code>details</code> / <code>summary</code> accordion block (handy for FAQ-style entries).</li>
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
