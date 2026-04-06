import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { extractTocFromMarkdown } from "@/lib/markdown-toc";
import Image from "next/image";

export function MarkdownWithToc({
	content,
	className,
}: {
	content: string;
	className?: string;
}) {
	const toc = extractTocFromMarkdown(content);
	let ptr = 0;

	const takeId = (level: 2 | 3) => {
		const item = toc[ptr];
		if (item?.level === level) {
			ptr += 1;
			return item.id;
		}
		return `section-${level}-${ptr}`;
	};

	const components = {
		h2: ({ children, className, ...props }: ComponentPropsWithoutRef<"h2">) => (
			<h2
				id={takeId(2)}
				className={[className, "scroll-mt-24"].filter(Boolean).join(" ")}
				{...props}
			>
				{children}
			</h2>
		),
		h3: ({ children, className, ...props }: ComponentPropsWithoutRef<"h3">) => (
			<h3
				id={takeId(3)}
				className={[className, "scroll-mt-24"].filter(Boolean).join(" ")}
				{...props}
			>
				{children}
			</h3>
		),
		img: ({
			alt,
			src,
			title,
			width,
			height,
			...props
		}: ComponentPropsWithoutRef<"img">) => {
			if (!src || typeof src !== "string") return null;

			const fallbackAlt =
				(alt && alt.trim()) ||
				(title && title.trim()) ||
				"Blog image";

			const w =
				typeof width === "number"
					? width
					: typeof width === "string"
						? Number.parseInt(width, 10)
						: NaN;
			const h =
				typeof height === "number"
					? height
					: typeof height === "string"
						? Number.parseInt(height, 10)
						: NaN;

			const resolvedWidth = Number.isFinite(w) && w > 0 ? w : 1200;
			const resolvedHeight = Number.isFinite(h) && h > 0 ? h : 630;

			return (
				<span className="block my-6">
					<Image
						src={src}
						alt={fallbackAlt}
						width={resolvedWidth}
						height={resolvedHeight}
						sizes="(max-width: 768px) 100vw, 768px"
						className="h-auto w-full rounded-xl"
						{...props}
					/>
				</span>
			);
		},
	};

	return (
		<div className={className}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw]}
				components={components}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
