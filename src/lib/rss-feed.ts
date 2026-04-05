export type RssFeedItem = {
	title: string;
	url: string;
	publishedAt: Date;
	description: string;
};

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/** RSS 2.0 document for published posts. */
export function buildBlogRssXml(baseUrl: string, items: RssFeedItem[]): string {
	const channelLink = `${baseUrl}/`;
	const lastBuild = new Date().toUTCString();

	const itemXml = items
		.map((it) => {
			const pub = it.publishedAt.toUTCString();
			const desc = escapeXml(it.description);
			return `
    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${escapeXml(it.url)}</link>
      <guid isPermaLink="true">${escapeXml(it.url)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
    </item>`;
		})
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Daily Thoughts</title>
    <link>${escapeXml(channelLink)}</link>
    <description>Latest stories from Daily Thoughts.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/feed.xml`)}" rel="self" type="application/rss+xml"/>
    ${itemXml}
  </channel>
</rss>`;
}
