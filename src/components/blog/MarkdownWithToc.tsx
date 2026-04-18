import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
	extractTocFromMarkdown,
	type TocItem,
} from "@/lib/markdown-toc";
import Image from "next/image";

export function MarkdownWithToc({
	content,
	toc: tocFromProps,
	className,
}: {
	content: string;
	/**
	 * Pre-parsed TOC. When omitted we extract it here, but callers that already
	 * parsed it (e.g. the article page) should pass it in to avoid parsing
	 * the same markdown twice on every render.
	 */
	toc?: TocItem[];
	className?: string;
}) {
	const toc = tocFromProps ?? extractTocFromMarkdown(content);
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
		table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
			<div className="not-prose my-6 w-full overflow-x-auto rounded-lg border border-border/60">
				<table
					className="m-0 w-full min-w-[36rem] border-collapse text-sm"
					{...props}
				>
					{children}
				</table>
			</div>
		),
		thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
			<thead className="bg-muted/40" {...props}>
				{children}
			</thead>
		),
		th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
			<th
				className="border border-border/80 px-3 py-3 text-left font-semibold align-middle first:pl-4 last:pr-4"
				{...props}
			>
				{children}
			</th>
		),
		td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
			<td
				className="border border-border/70 px-3 py-2 align-top first:pl-4 last:pr-4"
				{...props}
			>
				{children}
			</td>
		),
		tbody: ({ children, ...props }: ComponentPropsWithoutRef<"tbody">) => (
			<tbody {...props}>{children}</tbody>
		),
		tr: ({ children, ...props }: ComponentPropsWithoutRef<"tr">) => (
			<tr className="even:bg-muted/20" {...props}>
				{children}
			</tr>
		),
		a: ({
			href,
			children,
			rel,
			target,
			...props
		}: ComponentPropsWithoutRef<"a">) => {
			const rawHref = typeof href === "string" ? href : undefined;
			const isHashLink = !!rawHref && rawHref.startsWith("#");
			const isExternal =
				!!rawHref &&
				(/^(https?:)?\/\//i.test(rawHref) ||
					/^mailto:/i.test(rawHref) ||
					/^tel:/i.test(rawHref));

			if (isExternal && !isHashLink) {
				const combinedRel = [rel, "noopener", "noreferrer"]
					.filter(Boolean)
					.join(" ");
				return (
					<a
						href={rawHref}
						target={target ?? "_blank"}
						rel={combinedRel}
						{...props}
					>
						{children}
					</a>
				);
			}

			return (
				<a href={rawHref} target={target} rel={rel} {...props}>
					{children}
				</a>
			);
		},
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

			// Use a plain <img> for remote URLs to avoid Next/Image optimization
			// edge-cases (redirects, rate limits, hotlink protections) breaking posts.
			const isRemote = /^https?:\/\//i.test(src);
			if (isRemote) {
				return (
					<span className="block my-6">
						<img
							src={src}
							alt={fallbackAlt}
							loading="lazy"
							decoding="async"
							referrerPolicy="no-referrer"
							className="h-auto w-full rounded-xl"
							{...props}
						/>
					</span>
				);
			}

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
