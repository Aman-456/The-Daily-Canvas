/** Precomposed share targets (keep SocialShare + SocialShareCompact in sync). */
export function whatsAppShareUrl(fullUrl: string, title: string): string {
	const text = `${title}\n${fullUrl}`;
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
