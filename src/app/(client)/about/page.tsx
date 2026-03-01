import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBlogsCached } from "@/queries/blog";
import { FadeIn } from "@/components/client/FadeIn";

export default async function Home() {
	// Fetch latest 3 published blogs
	const { blogs } = await getBlogsCached(1, 3, "");

	return (
		<div className="space-y-20 py-10 md:py-20">
			{/* Hero Section */}
			<section className="text-center space-y-6 max-w-3xl mx-auto">
				<FadeIn>
					<h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
						Welcome to <span className="text-primary">The Daily Canvas</span>
					</h1>
				</FadeIn>
				<FadeIn delay={0.1}>
					<p className="text-xl text-muted-foreground">
						Discover beautiful stories, insightful tutorials, and amazing
						content curated just for you.
					</p>
				</FadeIn>
				<FadeIn delay={0.2}>
					<div className="flex items-center justify-center gap-4 pt-4">
						<Link href="/">
							<Button size="lg" className="rounded-full px-8">
								Read Blogs
							</Button>
						</Link>
						<Link href="/api/auth/signin">
							<Button size="lg" variant="outline" className="rounded-full px-8">
								Join the Community
							</Button>
						</Link>
					</div>
				</FadeIn>
			</section>

			{/* Featured Blogs Section */}
			<section className="space-y-8">
				<FadeIn delay={0.3}>
					<div className="flex items-center justify-between">
						<h2 className="text-3xl font-bold tracking-tight">
							Latest Stories
						</h2>
						<Link href="/" className="text-primary hover:underline font-medium">
							View all &rarr;
						</Link>
					</div>
				</FadeIn>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
					{blogs.map((blog: any, i: number) => {
						const readTime = Math.ceil(
							blog.content.trim().split(/\s+/).length / 200,
						);
						return (
							<FadeIn key={blog._id} delay={0.4 + i * 0.1}>
								<Link href={`/blogs/${blog.slug}`}>
									<article className="h-full group rounded-xl border border-border/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden hover:shadow-lg hover:border-border transition-all duration-300">
										<div className="aspect-[16/10] bg-muted overflow-hidden relative">
											{blog.coverImage ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={blog.coverImage}
													alt={blog.title}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
												/>
											) : (
												<div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 transition-transform duration-500 group-hover:scale-105" />
											)}
										</div>
										<div className="p-4 space-y-2.5">
											{blog.tags?.length > 0 && (
												<div className="flex gap-1.5">
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
											<p className="text-[11px] text-muted-foreground">
												{new Date(blog.createdAt).toLocaleDateString()}
											</p>
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
							</FadeIn>
						);
					})}
					{blogs.length === 0 && (
						<div className="col-span-full text-center text-muted-foreground py-10">
							No stories published yet.
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
