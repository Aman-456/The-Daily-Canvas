import { getPageBySlug } from "@/actions/page";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";

const getCachedPage = unstable_cache(
	async (slug: string) => {
		const res = await getPageBySlug(slug);
		return res;
	},
	["page-terms-of-service"],
	{ revalidate: 2592000, tags: ["page-terms-of-service"] } // 30 days
);

export const metadata = {
	title: "Terms of Service | Daily Thoughts",
	description: "Terms of Service for Daily Thoughts",
};

export default async function TermsOfServicePage() {
	const result = await getCachedPage("terms-of-service");

	if (!result.success || !result.data) {
		notFound();
	}

	const page = result.data;

	return (
		<div className="container max-w-3xl mx-auto py-5 md:py-10 space-y-12">
			<article className="prose prose-zinc dark:prose-invert mx-auto break-words prose-headings:font-bold prose-h1:text-4xl prose-a:text-primary">
				<div dangerouslySetInnerHTML={{ __html: page.content }} />
			</article>
		</div>
	);
}
