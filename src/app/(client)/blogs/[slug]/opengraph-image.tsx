import { ImageResponse } from "next/og";
import { getBlogBySlugCached } from "@/queries/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const blog = await getBlogBySlugCached(slug);

	if (!blog) {
		return new Response("Not found", { status: 404 });
	}

	return new ImageResponse(
		(
			<div
				style={{
					fontSize: 64,
					background: "linear-gradient(to bottom right, #18181b, #09090b)",
					color: "white",
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "80px",
					textAlign: "center",
				}}
			>
				<h1 style={{ marginBottom: "20px", fontWeight: "bold", lineHeight: 1.2 }}>
					{blog.title}
				</h1>
				<p style={{ fontSize: 32, color: "#a1a1aa", marginTop: 0 }}>
					{blog.authorId?.name || "Daily Thoughts"}
				</p>
				<div
					style={{
						position: "absolute",
						bottom: 40,
						right: 40,
						fontSize: 24,
						color: "#52525b",
						display: "flex",
						alignItems: "center",
					}}
				>
					Daily Thoughts
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
