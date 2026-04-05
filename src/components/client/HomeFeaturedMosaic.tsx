import { Sparkles } from "lucide-react";
import type { BlogPostCardItem } from "@/components/client/BlogPostCardGrid";
import { EditorialOverlayPostCard } from "@/components/client/EditorialOverlayPostCard";

export function HomeFeaturedMosaic({ items }: { items: BlogPostCardItem[] }) {
	const n = Math.min(items.length, 4);
	const slice = items.slice(0, n);
	if (n === 0) return null;

	if (n === 1) {
		return (
			<section className="space-y-4" aria-label="Featured stories">
				<div className="flex items-center gap-2">
					<Sparkles className="size-5 text-amber-500" aria-hidden />
					<h2 className="font-headline text-base font-bold tracking-tight md:text-lg">
						Featured
					</h2>
				</div>
				<EditorialOverlayPostCard
					blog={slice[0]}
					size="hero"
					className="h-full w-full"
				/>
			</section>
		);
	}

	if (n === 2) {
		return (
			<section className="space-y-4" aria-label="Featured stories">
				<div className="flex items-center gap-2">
					<Sparkles className="size-5 text-amber-500" aria-hidden />
					<h2 className="font-headline text-base font-bold tracking-tight md:text-lg">
						Featured
					</h2>
				</div>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<EditorialOverlayPostCard blog={slice[0]} size="hero" />
					<EditorialOverlayPostCard blog={slice[1]} size="hero" />
				</div>
			</section>
		);
	}

	if (n === 3) {
		return (
			<section className="space-y-4" aria-label="Featured stories">
				<div className="flex items-center gap-2">
					<Sparkles className="size-5 text-amber-500" aria-hidden />
					<h2 className="font-headline text-base font-bold tracking-tight md:text-lg">
						Featured
					</h2>
				</div>
				<div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-2">
					<EditorialOverlayPostCard
						blog={slice[0]}
						size="hero"
						className="lg:row-span-2 lg:min-h-[380px]"
					/>
					<EditorialOverlayPostCard blog={slice[1]} size="medium" />
					<EditorialOverlayPostCard blog={slice[2]} size="medium" />
				</div>
			</section>
		);
	}

	return (
		<section className="space-y-4" aria-label="Featured stories">
			<div className="flex items-center gap-2">
				<Sparkles className="size-5 text-amber-500" aria-hidden />
				<h2 className="font-headline text-base font-bold tracking-tight md:text-lg">
					Featured
				</h2>
			</div>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<EditorialOverlayPostCard
					blog={slice[0]}
					size="hero"
					className="min-h-[360px] lg:min-h-[400px]"
				/>
				<div className="grid grid-rows-2 gap-6">
					<EditorialOverlayPostCard blog={slice[1]} size="medium" />
					<div className="grid grid-cols-2 gap-6">
						<EditorialOverlayPostCard blog={slice[2]} size="small" />
						<EditorialOverlayPostCard blog={slice[3]} size="small" />
					</div>
				</div>
			</div>
		</section>
	);
}
