import { permanentRedirect } from "next/navigation";
 
export default async function BlogCommentThreadPage({
	params,
}: {
	params: Promise<{ slug: string; commentId: string }>;
}) {
	const { slug, commentId } = await params;
	permanentRedirect(`/articles/${slug}/thread/${commentId}`);
}
