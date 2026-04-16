import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditorialArchiveGrid } from "@/components/client/EditorialArchiveGrid";
import { getAuthorStats, getPublicAuthorByUsername, getPublishedArticlesByAuthorId } from "@/queries/author";
import { blogTagLabel, topicListingHref } from "@/lib/blog-tags";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ username: string }>;
}): Promise<Metadata> {
	const { username } = await params;
	const canonical = `${baseUrl}/u/${encodeURIComponent(username)}`;
	return {
		title: `${username} | Daily Thoughts`,
		description: `Articles and topics by ${username} on Daily Thoughts.`,
		alternates: { canonical },
		openGraph: { title: `${username} | Daily Thoughts`, url: canonical },
	};
}

export default async function AuthorProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;
	const author = await getPublicAuthorByUsername(username);
	if (!author) notFound();

	const [{ articleCount, topTags }, { articles }] = await Promise.all([
		getAuthorStats(author.id),
		getPublishedArticlesByAuthorId(author.id, 1, 3),
	]);

	return (
		<div className="space-y-12 pb-16 sm:space-y-14 sm:pb-24">
			<header className="border-b border-border/50 pb-10">
				<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div className="max-w-3xl space-y-4">
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
							Author
						</p>
						<div className="flex items-center gap-4">
							<Avatar className="h-14 w-14 border shadow-sm">
								<AvatarImage src={author.image || undefined} />
								<AvatarFallback>
									{author.name?.charAt(0) || author.username?.charAt(0) || "U"}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<h1 className="font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
									{author.name?.trim() || author.username || "Author"}
								</h1>
								<p className="text-sm text-muted-foreground">
									@{author.username} · {articleCount}{" "}
									{articleCount === 1 ? "article" : "articles"}
								</p>
							</div>
						</div>

						{author.bio?.trim() ? (
							<p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
								{author.bio.trim()}
							</p>
						) : null}

						{topTags.length > 0 ? (
							<div className="flex flex-wrap gap-2 pt-2">
								{topTags.slice(0, 10).map((t) => (
									<Link
										key={t.tag}
										href={topicListingHref({ slug: t.tag })}
										className="text-xs font-medium px-2.5 py-1 rounded-full text-primary/90 bg-primary/10 hover:bg-primary/20 underline-offset-2 hover:underline"
									>
										{blogTagLabel(t.tag)}
									</Link>
								))}
							</div>
						) : null}

						<p className="text-sm">
							<Link
								href="/archive"
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								← Archive
							</Link>
						</p>
						<p className="text-sm">
							<Link
								href={`/u/${encodeURIComponent(author.username || username)}/articles`}
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								→ Author archive
							</Link>
						</p>
					</div>
				</div>
			</header>

			<section className="space-y-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-lg font-bold tracking-tight">Recent articles</h2>
						<p className="text-sm text-muted-foreground">
							Latest published work by @{author.username}.
						</p>
					</div>
					<Link
						href={`/u/${encodeURIComponent(author.username || username)}/articles`}
						className="text-sm font-medium text-primary underline-offset-4 hover:underline"
					>
						View all →
					</Link>
				</div>

				{articles.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No published articles yet.
					</p>
				) : (
					<EditorialArchiveGrid blogs={articles} />
				)}
			</section>

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: `${author.username} | Daily Thoughts`,
						description: `Articles and topics by ${author.username} on Daily Thoughts.`,
						path: `/u/${author.username}`,
						type: "WebPage",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: "Authors", item: "/archive" },
						{ name: `@${author.username}`, item: `/u/${author.username}` },
					]),
				])}
			/>
		</div>
	);
}

