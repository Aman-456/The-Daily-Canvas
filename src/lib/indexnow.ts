// src/lib/indexnow.ts
export async function pingIndexNow(blogSlug: string) {
	try {
		const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
		if (!appUrl) {
			console.log("[IndexNow] NEXT_PUBLIC_APP_URL is not set.");
			return;
		}

		const urlToPing = `${appUrl}/blogs/${blogSlug}`;
		const apiKey = "df3ccbb1d0a942fc882435bcb0ae6acd";

		const indexNowUrl = `https://www.bing.com/indexnow?url=${encodeURIComponent(
			urlToPing,
		)}&key=${apiKey}`;

		const response = await fetch(indexNowUrl);

		if (response.ok) {
			console.log(`[IndexNow] Successfully pinged Bing for ${urlToPing}`);
		} else {
			console.error(`[IndexNow] Ping failed with status: ${response.status}`);
		}
	} catch (error) {
		console.error("[IndexNow] Error pinging IndexNow:", error);
	}
}
