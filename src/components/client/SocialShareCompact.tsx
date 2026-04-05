"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Facebook, Link as LinkIcon, Linkedin, XIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { whatsAppShareUrl } from "@/lib/social-share-urls";

export function SocialShareCompact({
	url,
	title,
	variant = "default",
}: {
	url: string;
	title: string;
	/** Tighter icon row for the header strip. */
	variant?: "default" | "header";
}) {
	const fullUrl =
		typeof window !== "undefined"
			? `${window.location.origin}${url}`
			: `${process.env.NEXT_PUBLIC_APP_URL!}${url}`;

	const share = (platform: string) => {
		let shareUrl = "";
		switch (platform) {
			case "twitter":
				shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
				break;
			case "facebook":
				shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
				break;
			case "linkedin":
				shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`;
				break;
			case "whatsapp":
				shareUrl = whatsAppShareUrl(fullUrl, title);
				break;
		}
		if (shareUrl) {
			window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
		}
	};

	const btn =
		variant === "header"
			? "size-8 rounded-lg text-muted-foreground hover:bg-background/80 hover:text-foreground"
			: "size-7 text-muted-foreground hover:text-foreground";
	const icon = variant === "header" ? "size-4" : "size-3.5";

	return (
		<div
			className={
				variant === "header"
					? "flex shrink-0 items-center gap-0.5 rounded-xl border border-border/40 bg-background/60 p-0.5 dark:bg-background/20"
					: "flex items-center gap-0.5"
			}
		>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className={btn}
				title="Copy link"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					navigator.clipboard.writeText(fullUrl);
					toast.success("Link copied");
				}}
			>
				<LinkIcon className={icon} />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className={`${btn} hover:text-sky-500`}
				title="Share on X"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					share("twitter");
				}}
			>
				<XIcon className={icon} />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className={`${btn} hover:text-blue-600`}
				title="Facebook"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					share("facebook");
				}}
			>
				<Facebook className={icon} />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className={`${btn} hover:text-blue-700`}
				title="LinkedIn"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					share("linkedin");
				}}
			>
				<Linkedin className={icon} />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className={`${btn} hover:text-emerald-600`}
				title="WhatsApp"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					share("whatsapp");
				}}
			>
				<WhatsAppIcon className={icon} />
			</Button>
		</div>
	);
}
