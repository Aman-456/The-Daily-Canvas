"use client";

import { Sparkles } from "lucide-react";
import type { BlogPostCardItem } from "@/components/client/BlogPostCardGrid";
import { EditorialOverlayPostCard } from "@/components/client/EditorialOverlayPostCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

export function HomeFeaturedMosaic({ items }: { items: BlogPostCardItem[] }) {
	const n = Math.min(items.length, 4);
	const slice = items.slice(0, n);
	if (n === 0) return null;

	return (
		<section className="space-y-4" aria-label="Featured stories">
			<div className="flex items-center gap-2">
				<Sparkles className="size-5 text-amber-500" aria-hidden />
				<h2 className="font-headline text-base font-bold tracking-tight md:text-lg">
					Featured
				</h2>
			</div>

			{/* Mobile: real carousel (loop + autoplay + pagination), 1.2 slides per view */}
			<div className="md:hidden -mx-4 px-4">
				{n === 1 ? (
					<EditorialOverlayPostCard
						blog={slice[0]}
						size="hero"
						className="h-full w-full"
					/>
				) : (
					<Swiper
						className="home-featured-swiper"
						modules={[Autoplay, Pagination]}
						slidesPerView={1.1}
						spaceBetween={16}
						loop
						autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
						pagination={{ clickable: true }}
						style={
							{
								// Keep dots visible and avoid horizontal overflow.
								paddingBottom: "44px",
							} as any
						}
					>
						{slice.map((blog) => (
							<SwiperSlide key={blog.slug} style={{ height: "auto" }}>
								<div className="h-full">
									<EditorialOverlayPostCard
										blog={blog}
										size="hero"
										className="h-full w-full"
										titleClassName="text-lg sm:text-xl md:text-xl"
										overlayClassName="from-black/90 via-black/40"
										tintClassName="bg-black/15"
									/>
								</div>
							</SwiperSlide>
						))}
					</Swiper>
				)}
			</div>

			{/* Desktop: keep editorial mosaic */}
			<div className="hidden md:block">
				{n === 1 ? (
					<EditorialOverlayPostCard blog={slice[0]} size="hero" className="h-full w-full" />
				) : n === 2 ? (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<EditorialOverlayPostCard blog={slice[0]} size="hero" />
						<EditorialOverlayPostCard blog={slice[1]} size="hero" />
					</div>
				) : n === 3 ? (
					<div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-2">
						<EditorialOverlayPostCard
							blog={slice[0]}
							size="hero"
							className="lg:row-span-2 lg:min-h-[380px]"
						/>
						<EditorialOverlayPostCard blog={slice[1]} size="medium" />
						<EditorialOverlayPostCard blog={slice[2]} size="medium" />
					</div>
				) : (
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
				)}
			</div>
		</section>
	);
}
