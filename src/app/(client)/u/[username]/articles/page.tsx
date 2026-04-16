import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialArchiveGrid } from "@/components/client/EditorialArchiveGrid";
import { EditorialPagination } from "@/components/client/EditorialPagination";
import { getPublicAuthorByUsername, getPublishedArticlesByAuthorId } from "@/queries/author";
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

	const { articles, totalPages, total } = await getPublishedArticlesByAuthorId(
		author.id,
		page,
		12,
	);

	const pageHref = (n: number) => `/u/${encodeURIComponent(author.username || username)}/articles?page=${n}`;

	return (
		<div className="space-y-12 pb-16 sm:space-y-14 sm:pb-24">
			<header className="border-b border-border/50 pb-10">
				<div className="max-w-3xl space-y-4">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
						Author archive
					</p>
					<h1 className="font-headline text-4xl font-extrabold tracking-tighter text-foreground sm:text-5xl">
						@{author.username}
					</h1>
					<p className="text-sm text-muted-foreground">
						{total} {total === 1 ? "article" : "articles"} published.
					</p>
					<p className="text-sm">
						<Link
							href={`/u/${encodeURIComponent(author.username || username)}`}
							className="font-medium text-primary underline-offset-4 hover:underline"
						>
							← Profile
						</Link>
					</p>
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

