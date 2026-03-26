import Link from "next/link";
import { getBlogsCached } from "@/queries/blog";
import SearchInput from "@/components/client/SearchInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
	title: "Explore Blogs | Daily Thoughts",
	description: "Read the latest stories, blog posts, and insights.",
	keywords: ["blog", "stories", "insights", "daily thoughts", "reading"],
	alternates: {
		canonical: "/",
	},
};

// Ensure route is dynamic since it uses searchParams
export const dynamic = "force-dynamic";

function calculateReadTime(content: string) {
	const wordsPerMinute = 200;

	const words = content?.trim().split(/\s+/).length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return minutes;
}

export default async function BlogsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const page = typeof params.page === "string" ? Number(params.page) : 1;
	const search = typeof params.search === "string" ? params.search : "";

	const { blogs, totalPages } = await getBlogsCached(page, 12, search);

	return (
		<div className="space-y-10">
			<div className="flex flex-col md:flex-row items-center justify-between gap-4">
				<div>
					<h1 className="text-4xl font-bold tracking-tight">Explore Blogs</h1>
					<p className="text-muted-foreground mt-2">
						Read the latest stories and insights.
					</p>
				</div>

				{/* Simple search form hitting the same route */}
				<SearchInput defaultValue={search} />
			</div>

			{blogs.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					No blogs found matching your criteria.
				</div>
			) : (
				<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
					{blogs.map((blog: any) => {

						const readTime = calculateReadTime(blog.content);
						return (
							<Link key={blog._id} href={`/blogs/${blog.slug}`}>
								<article className="h-full group rounded-xl border border-border/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:border-border transition-all duration-300">
									<div className="aspect-16/10 bg-muted relative overflow-hidden">
										{blog.coverImage ? (
											<Image
												src={blog.coverImage!}
												alt={blog.title}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												className="object-cover group-hover:scale-105 transition-transform duration-500"
											/>
										) : (
											<div className="w-full h-full bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 transition-transform duration-500 group-hover:scale-105" />
										)}
									</div>

									<div className="p-4 space-y-2.5">
										{blog.tags?.length > 0 && (
											<div className="flex flex-wrap gap-1.5">
												{blog.tags.slice(0, 2).map((tag: string) => (
													<span
														key={tag}
														className="text-[11px] font-medium text-primary/80 bg-primary/8 px-2 py-0.5 rounded-full"
													>
														{tag}
													</span>
												))}
											</div>
										)}

										<h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
											{blog.title}
										</h3>

										<p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
											{blog.excerpt || blog.content.substring(0, 120) + "..."}
										</p>
									</div>

									<div className="px-4 pb-3.5 pt-1 flex items-center justify-between border-t border-border/40">
										<div className="flex items-center gap-2">
											<Avatar className="h-7 w-7 border">
												<AvatarImage src={blog.authorId?.image || undefined} />
												<AvatarFallback className="text-[10px]">
													{blog.authorId?.name?.charAt(0) || "U"}
												</AvatarFallback>
											</Avatar>
											<div className="text-[11px] leading-tight">
												<p className="font-medium text-foreground">
													{blog.authorId?.name}
												</p>
												<p className="text-muted-foreground">
													{new Date(blog.createdAt).toLocaleDateString()}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
											<span className="flex items-center gap-1">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													className="w-3.5 h-3.5"
												>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
														clipRule="evenodd"
													/>
												</svg>
												{readTime} min
											</span>
											<span className="flex items-center gap-1">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="currentColor"
													className="w-3.5 h-3.5"
												>
													<path
														fillRule="evenodd"
														d="M2 5a3 3 0 013-3h10a3 3 0 013 3v6a3 3 0 01-3 3h-1.586l-2.707 2.707a1 1 0 01-1.414 0L6.586 14H5a3 3 0 01-3-3V5zm3-1a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 01.707.293L10 14.586l2.293-2.293A1 1 0 0113 12h2a1 1 0 001-1V5a1 1 0 00-1-1H5z"
														clipRule="evenodd"
													/>
												</svg>
												{blog.commentsCount || 0}
											</span>
										</div>
									</div>
								</article>
							</Link>
						);
					})}
				</div>
			)}

			{/* Basic Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-center gap-2 pt-10">
					{Array.from({ length: totalPages }).map((_, i) => (
						<Link
							key={i}
							href={`/?page=${i + 1}${search ? `&search=${search}` : ""}`}
							className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${page === i + 1
								? "bg-primary text-primary-foreground font-bold"
								: "bg-muted hover:bg-muted/80"
								}`}
						>
							{i + 1}
						</Link>
					))}
				</div>
			)}

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebSite",
						name: "The Daily Thoughts",
						url: process.env.NEXT_PUBLIC_APP_URL,
						potentialAction: {
							"@type": "SearchAction",
							target: `${process.env.NEXT_PUBLIC_APP_URL
								}/?search={search_term_string}`,
							"query-input": "required name=search_term_string",
						},
					}),
				}}
			/>
		</div>
	);
}
