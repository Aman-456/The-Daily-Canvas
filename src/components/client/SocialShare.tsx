"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Facebook, Link as LinkIcon, Linkedin, XIcon } from "lucide-react";

export function SocialShare({
	url,
	title,
	size = "default",
}: {
	url: string;
	title: string;
	size?: "default" | "sm";
}) {
	const fullUrl =
		typeof window !== "undefined"
			? `${window.location.origin}${url}`
			: `https://thedailycanvas.com${url}`;

	const handleCopy = () => {
		navigator.clipboard.writeText(fullUrl);
		toast.success("Link copied to clipboard!");
	};

	const handleShare = (platform: string) => {
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
		}
		if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400");
	};

	return (
		<div className="flex gap-2">
			<Button
				variant="outline"
				className="cursor-pointer"
				size={size}
				onClick={handleCopy}
				title="Copy Link"
			>
				<LinkIcon className={`h-4 w-4 ${size === "sm" ? "" : "mr-2"}`} />
				{size !== "sm" && "Copy Link"}
			</Button>
			<Button
				variant="outline"
				size={size}
				onClick={() => handleShare("twitter")}
				title="Share on Twitter"
				className="text-blue-400  border-blue-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30"
			>
				<XIcon className="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size={size}
				onClick={() => handleShare("facebook")}
				title="Share on Facebook"
				className="text-blue-600 border-blue-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30"
			>
				<Facebook className="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size={size}
				onClick={() => handleShare("linkedin")}
				title="Share on LinkedIn"
				className="text-blue-700 border-blue-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30"
			>
				<Linkedin className="h-4 w-4" />
			</Button>
		</div>
	);
}
