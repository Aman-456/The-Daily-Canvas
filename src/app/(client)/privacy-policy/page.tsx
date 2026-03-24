import { getPageBySlug } from "@/actions/page";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";

const getCachedPage = unstable_cache(
	async (slug: string) => {
		const res = await getPageBySlug(slug);
		return res;
	},
	["page-privacy-policy"],
	{ revalidate: 2592000, tags: ["page-privacy-policy"] } // 30 days
);

export const metadata = {
	title: "Privacy Policy | The Daily Canvas",
	description: "Privacy Policy for The Daily Canvas",
};

export default async function PrivacyPolicyPage() {
	const result = await getCachedPage("privacy-policy");

	if (!result.success || !result.data) {
		notFound();
	}

	const page = result.data;

	return (
		<div className="container max-w-4xl py-12 md:py-20">
			<article className="prose prose-zinc dark:prose-invert mx-auto break-words prose-headings:font-bold prose-h1:text-4xl prose-a:text-primary">
				<div dangerouslySetInnerHTML={{ __html: page.content }} />
			</article>
		</div>
	);
}
