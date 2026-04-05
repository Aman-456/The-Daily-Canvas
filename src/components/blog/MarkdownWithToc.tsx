import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { extractTocFromMarkdown } from "@/lib/markdown-toc";

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
