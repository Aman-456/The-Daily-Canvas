import { Suspense } from "react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/client/SiteHeader";
import { SiteHeaderFallback } from "@/components/client/SiteHeaderFallback";
import { SiteFooter } from "@/components/client/SiteFooter";
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
			<main className="flex-1 px-4 py-10 sm:px-8 sm:py-12">
				<div className="mx-auto w-full max-w-screen-2xl">{children}</div>
			</main>
			<div className="mx-auto w-full max-w-screen-2xl px-4 pb-12 sm:px-8">
				<NewsletterFeatureBand />
			</div>
			<SiteFooter />
		</div>
	);
}
