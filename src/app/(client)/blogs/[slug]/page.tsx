import { permanentRedirect } from "next/navigation";
 
export const revalidate = 3600;

export default async function LegacyBlogPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	permanentRedirect(`/articles/${slug}`);
}

 

 
