import { getPageBySlug } from "@/actions/page";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { JsonLd } from "@/components/seo/JsonLd";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";


const getCachedPage = unstable_cache(
	async (slug: string) => {
		const res = await getPageBySlug(slug);
		return res;
	},
	["page-privacy-policy"],
	{ revalidate: 2592000, tags: ["page-privacy-policy"] } // 30 days
);

export const metadata = {
	title: "Privacy Policy | Daily Thoughts",
	description: "Privacy Policy for Daily Thoughts",
	keywords: ["privacy policy", "daily thoughts", "Blog"],
	alternates: {
		canonical: "/privacy-policy",
	},
	openGraph: {
		title: "Privacy Policy | Daily Thoughts",
		description: "Privacy Policy for Daily Thoughts",
		images: [
			{ url: "/favicon.ico" },
		],
	},
};

export default async function PrivacyPolicyPage() {
	const result = await getCachedPage("privacy-policy");

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

			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: page.title,
						description: "Privacy Policy for Daily Thoughts.",
						path: "/privacy-policy",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: "Privacy", item: "/privacy-policy" },
					]),
				])}
			/>
		</div>
	);
}
