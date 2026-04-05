import type { ReactNode } from "react";

function EmptyListingGraphic() {
	return (
		<div
			className="mb-8 w-full max-w-[280px] text-muted-foreground"
			aria-hidden
		>
			<svg
				viewBox="0 0 280 220"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className="h-auto w-full"
			>
				<ellipse
					cx="140"
					cy="118"
					rx="108"
					ry="88"
					className="fill-muted/50 dark:fill-muted/25"
				/>
				<path
					d="M72 148c0-26.51 21.49-48 48-48h40c26.51 0 48 21.49 48 48v8H72v-8Z"
					className="fill-background stroke-border"
					strokeWidth="2"
				/>
				<rect
					x="88"
					y="64"
					width="104"
					height="72"
					rx="10"
					className="fill-card stroke-border"
					strokeWidth="2"
				/>
				<path
					d="M102 84h76M102 98h56M102 112h64"
					className="stroke-muted-foreground/45"
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<circle
					cx="178"
					cy="152"
					r="36"
					className="fill-primary/12 stroke-primary/35"
					strokeWidth="2"
				/>
				<path
					d="m204 178 28 28"
					className="stroke-primary/50"
					strokeWidth="4"
					strokeLinecap="round"
				/>
				<path
					d="M168 148h20M178 138v20"
					className="stroke-primary/55"
					strokeWidth="3"
					strokeLinecap="round"
				/>
			</svg>
		</div>
	);
}

/**
 * Illustrated empty state for listings (search, archive, topics, home grid).
 */
export function EditorialListingEmptyState({
	title,
	description,
}: {
	title: ReactNode;
	description: ReactNode;
}) {
	return (
		<div
			className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24"
			role="status"
			aria-live="polite"
		>
			<EmptyListingGraphic />
			<h2 className="font-headline text-xl font-bold tracking-tight text-foreground sm:text-2xl">
				{title}
			</h2>
			<div className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
				{description}
			</div>
		</div>
	);
}

/** Preset copy for /search empty grids */
export function SearchNoResultsIllustration({
	hasQuery,
	query,
}: {
	hasQuery: boolean;
	query?: string;
}) {
	return (
		<EditorialListingEmptyState
			title={hasQuery ? "Nothing turned up" : "Nothing here yet"}
			description={
				hasQuery ? (
					query ? (
						<>
							No posts match{" "}
							<span className="font-medium text-foreground">“{query}”</span>{" "}
							with your current filters. Try a shorter phrase, different
							keywords, or clear a topic chip.
						</>
					) : (
						<>
							No posts match your current filters. Try different keywords or
							fewer topic tags.
						</>
					)
				) : (
					<>
						There aren’t any published stories in the archive yet. Check back
						soon, or head home for the latest.
					</>
				)
			}
		/>
	);
}
