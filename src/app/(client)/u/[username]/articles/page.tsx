import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditorialArchiveGrid } from "@/components/client/EditorialArchiveGrid";
import { EditorialPagination } from "@/components/client/EditorialPagination";
import {
	getAuthorStats,
	getPublicAuthorByUsername,
	getPublishedArticlesByAuthorId,
} from "@/queries/author";
import { blogTagLabel, topicListingHref } from "@/lib/blog-tags";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ username: string }>;
}): Promise<Metadata> {
	const { username } = await params;
	const canonical = `${baseUrl}/u/${encodeURIComponent(username)}/articles`;
	return {
		title: `@${username} — Articles | Daily Thoughts`,
		description: `All published articles by ${username}.`,
		alternates: { canonical },
		openGraph: { title: `@${username} — Articles`, url: canonical },
	};
}

export default async function AuthorArticlesPage({
	params,
	searchParams,
}: {
	params: Promise<{ username: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { username } = await params;
	const sp = await searchParams;
	const page = typeof sp.page === "string" ? Number(sp.page) : 1;

	const author = await getPublicAuthorByUsername(username);
	if (!author) notFound();

	const { topTags } = await getAuthorStats(author.id);
	const { articles, totalPages, total } = await getPublishedArticlesByAuthorId(
		author.id,
		page,
		12,
	);

	const pageHref = (n: number) => `/u/${encodeURIComponent(author.username || username)}/articles?page=${n}`;

	return (
		<div className="space-y-12 pb-16 sm:space-y-14 sm:pb-24">
			<header className="border-b border-border/50 pb-10">
				<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div className="max-w-3xl space-y-4">
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
							Author archive
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
									@{author.username} · {total}{" "}
									{total === 1 ? "article" : "articles"}
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
								href={`/u/${encodeURIComponent(author.username || username)}`}
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								← Profile
							</Link>
						</p>
					</div>
				</div>
			</header>

			{articles.length === 0 ? (
				<p className="text-sm text-muted-foreground">No published articles yet.</p>
			) : (
				<EditorialArchiveGrid blogs={articles} />
			)}

			<EditorialPagination page={page} totalPages={totalPages} pageHref={pageHref} />

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: `@${author.username} — Articles | Daily Thoughts`,
						description: `All published articles by ${author.username}.`,
						path: `/u/${author.username}/articles`,
						type: "CollectionPage",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: `@${author.username}`, item: `/u/${author.username}` },
						{ name: "Articles", item: `/u/${author.username}/articles` },
					]),
				])}
			/>
		</div>
	);
}

