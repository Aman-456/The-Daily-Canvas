import Link from "next/link";

export function SiteFooter() {
	const year = new Date().getFullYear();
	return (
		<footer className="mt-auto border-t border-border/40 bg-muted/30 py-14 dark:bg-muted/10">
			<div className="mx-auto max-w-screen-2xl px-4 sm:px-8">
				<div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
					<div className="lg:col-span-2">
						<span className="font-headline text-lg font-bold text-foreground">
							Daily Thoughts
						</span>
						<p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
							A publication for curious readers — essays, craft, and ideas worth
							slowing down for.
						</p>
					</div>
					<div>
						<h4 className="font-headline mb-4 text-sm font-bold text-foreground">
							Explore
						</h4>
						<ul className="space-y-3 text-sm text-muted-foreground">
							<li>
								<Link
									href="/"
									className="transition-colors hover:text-primary"
								>
									All stories
								</Link>
							</li>
							<li>
								<Link
									href="/archive"
									className="transition-colors hover:text-primary"
								>
									Archive
								</Link>
							</li>
							<li>
								<Link
									href="/search"
									className="transition-colors hover:text-primary"
								>
									Search
								</Link>
							</li>
							<li>
								<Link
									href="/about"
									className="transition-colors hover:text-primary"
								>
									About
								</Link>
							</li>
						</ul>
					</div>
					<div>
						<h4 className="font-headline mb-4 text-sm font-bold text-foreground">
							Legal
						</h4>
						<ul className="space-y-3 text-sm text-muted-foreground">
							<li>
								<Link
									href="/terms-of-service"
									className="transition-colors hover:text-primary"
								>
									Terms
								</Link>
							</li>
							<li>
								<Link
									href="/privacy-policy"
									className="transition-colors hover:text-primary"
								>
									Privacy
								</Link>
							</li>
						</ul>
					</div>
				</div>
				<div className="border-t border-border/40 pt-10">
					<p className="text-center text-xs text-muted-foreground">
						© {year} Daily Thoughts. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
