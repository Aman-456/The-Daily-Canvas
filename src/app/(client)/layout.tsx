import { Suspense } from "react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/client/SiteHeader";
import { SiteHeaderFallback } from "@/components/client/SiteHeaderFallback";
import { SiteFooter } from "@/components/client/SiteFooter";
import { MobileBottomNav } from "@/components/client/MobileBottomNav";
import { NewsletterFeatureBand } from "@/components/client/NewsletterFeatureBand";

export default async function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	return (
		<div className="relative flex min-h-screen flex-col">
			<Suspense fallback={<SiteHeaderFallback />}>
				<SiteHeader session={session} />
			</Suspense>
			<main className="flex-1 px-4 pt-10 pb-24 sm:px-8 sm:pt-12 sm:pb-24 md:pb-12">
				<div className="mx-auto w-full max-w-screen-2xl">{children}</div>
			</main>
			<div className="mx-auto w-full max-w-screen-2xl px-4 pb-12 sm:px-8 max-md:pb-16">
				<NewsletterFeatureBand />
			</div>
			<SiteFooter />
			<MobileBottomNav />
		</div>
	);
}
