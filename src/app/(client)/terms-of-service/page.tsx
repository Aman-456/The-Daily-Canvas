import { getPageBySlug } from "@/actions/page";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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
		<div className="prose prose-md dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-pre:bg-zinc-900 prose-pre:shadow-lg leading-relaxed antialiased">
			<div className="container max-w-3xl mx-auto py-5 md:py-10 space-y-12">
				<h1 className="text-3xl sm:text-4xl md:text-4xl font-extrabold tracking-tight md:text-center">
					{page.title}
				</h1>
				<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
					{page.content}
				</ReactMarkdown>
			</div>
		</div>
	);
}
