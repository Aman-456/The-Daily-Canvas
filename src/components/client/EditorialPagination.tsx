import Link from "next/link";

export function EditorialPagination({
	page,
	totalPages,
	pageHref,
}: {
	page: number;
	totalPages: number;
	pageHref: (n: number) => string;
}) {
	if (totalPages <= 1) return null;

	return (
		<nav
			className="flex flex-wrap items-center justify-center gap-2 pt-12"
			aria-label="Pagination"
		>
			{Array.from({ length: totalPages }).map((_, i) => {
				const n = i + 1;
				const active = page === n;
				return (
					<Link
						key={n}
						href={pageHref(n)}
						className={
							active
								? "font-headline flex h-11 min-w-11 items-center justify-center rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground"
								: "font-headline flex h-11 min-w-11 items-center justify-center rounded-xl bg-muted px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
						}
					>
						{n}
					</Link>
				);
			})}
		</nav>
	);
}
