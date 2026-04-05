import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

/**
 * Renders FAQ CMS HTML with styled &lt;details&gt; accordions (chevron, borders, open transition).
 * Custom elements avoid typography `prose` breaking native disclosure.
 */
const faqMarkdownComponents: Partial<Components> = {
	details({ children, ...props }) {
		return (
			<details
				className="group rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-[box-shadow,border-color] duration-200 ease-out open:border-border open:shadow-md dark:bg-muted/10"
				{...props}
			>
				{children}
			</details>
		);
	},
	summary({ children, ...props }) {
		return (
			<summary
				className="flex cursor-pointer list-none items-start gap-2 font-bold tracking-tight text-foreground select-none [&::-webkit-details-marker]:hidden"
				{...props}
			>
				<span
					className="faq-chevron mt-0.5 inline-flex size-5 shrink-0 items-center justify-center text-lg font-normal leading-none text-primary transition-transform duration-200 ease-out group-open:rotate-90"
					aria-hidden
				>
					›
				</span>
				<span className="min-w-0 flex-1 pt-0.5">{children}</span>
			</summary>
		);
	},
};

export function FaqMarkdownBody({ content }: { content: string }) {
	return (
		<div className="faq-md space-y-3">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw]}
				components={faqMarkdownComponents}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
