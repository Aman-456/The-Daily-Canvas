/**
 * ensure-cover-image-in-blob
 *
 * Downloads a blog's external `coverImage`, uploads it to Vercel Blob, and updates the DB.
 * Safe to re-run (skips if already a Vercel Blob URL).
 *
 * Usage:
 *   npx tsx scripts/ensure-cover-image-in-blob.ts --slug <blog-slug>
 *   npx tsx scripts/ensure-cover-image-in-blob.ts --slug <blog-slug> --file <path-to-image>
 *
 * Requires:
 *   BLOB_READ_WRITE_TOKEN
 *   DATABASE_URL
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { put } from "@vercel/blob";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { eq } from "drizzle-orm";

function argValue(flag: string): string | null {
	const idx = process.argv.indexOf(flag);
	if (idx === -1) return null;
	const v = process.argv[idx + 1];
	return typeof v === "string" && v.trim() ? v.trim() : null;
}

function isVercelBlobUrl(url: string) {
	return url.includes("vercel-storage.com");
}

function extFromContentType(ct: string | null): string {
	const v = (ct || "").toLowerCase();
	if (v.includes("image/avif")) return ".avif";
	if (v.includes("image/webp")) return ".webp";
	if (v.includes("image/png")) return ".png";
	if (v.includes("image/gif")) return ".gif";
	if (v.includes("image/jpeg") || v.includes("image/jpg")) return ".jpg";
	return "";
}

function contentTypeFallbackFromExt(ext: string): string | undefined {
	switch (ext.toLowerCase()) {
		case ".avif":
			return "image/avif";
		case ".webp":
			return "image/webp";
		case ".png":
			return "image/png";
		case ".gif":
			return "image/gif";
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		default:
			return undefined;
	}
}

function extFromFilePath(p: string): string {
	const ext = path.extname(p).toLowerCase();
	if (!/^\.(avif|webp|png|gif|jpe?g)$/.test(ext)) return "";
	return ext === ".jpeg" ? ".jpg" : ext;
}

function extFromUrl(url: string): string {
	try {
		const u = new URL(url);
		const base = u.pathname.split("/").pop() || "";
		const dot = base.lastIndexOf(".");
		if (dot === -1) return "";
		const ext = base.slice(dot).toLowerCase();
		if (!/^\.(avif|webp|png|gif|jpe?g)$/.test(ext)) return "";
		return ext === ".jpeg" ? ".jpg" : ext;
	} catch {
		return "";
	}
}

function deriveWikimediaOriginal(url: string): string | null {
	// Example thumb:
	// https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Foo.jpg/1200px-Foo.jpg
	// Original:
	// https://upload.wikimedia.org/wikipedia/commons/6/6f/Foo.jpg
	try {
		const u = new URL(url);
		if (!u.hostname.endsWith("wikimedia.org")) return null;
		const parts = u.pathname.split("/").filter(Boolean);
		const thumbIdx = parts.indexOf("thumb");
		if (thumbIdx === -1) return null;
		if (parts.length < thumbIdx + 4) return null;
		const origParts = parts.slice(0, thumbIdx).concat(parts.slice(thumbIdx + 1, thumbIdx + 4));
		u.pathname = "/" + origParts.join("/");
		u.search = "";
		u.hash = "";
		return u.toString();
	} catch {
		return null;
	}
}

async function fetchWithRetry(url: string): Promise<Response> {
	let lastErr: any = null;
	const candidates = [url];
	const wmOrig = deriveWikimediaOriginal(url);
	if (wmOrig && wmOrig !== url) candidates.push(wmOrig);

	for (let i = 0; i < candidates.length; i++) {
		const candidate = candidates[i];
		for (let attempt = 0; attempt < 3; attempt++) {
			const res = await fetch(candidate, {
				headers: {
					"user-agent": "TheDailyCanvas/1.0 (cover-image-migration)",
					accept: "image/avif,image/webp,image/png,image/*;q=0.8,*/*;q=0.5",
				},
			});
			if (res.ok) return res;

			// If rate-limited, back off and retry; otherwise break quickly.
			if (res.status === 429) {
				const ra = res.headers.get("retry-after");
				const waitMs = ra ? Math.min(30_000, Number(ra) * 1000) : 1500 * (attempt + 1);
				await new Promise((r) => setTimeout(r, waitMs));
				lastErr = new Error(`429 rate-limited: ${candidate}`);
				continue;
			}

			lastErr = new Error(`Failed (${res.status}): ${candidate}`);
			break;
		}
	}

	throw lastErr || new Error(`Failed to fetch: ${url}`);
}

async function main() {
	if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
		console.error("Missing BLOB_READ_WRITE_TOKEN.");
		process.exit(1);
	}
	if (!process.env.DATABASE_URL?.trim()) {
		console.error("Missing DATABASE_URL.");
		process.exit(1);
	}

	const slug = argValue("--slug") || argValue("-s") || null;
	if (!slug) {
		console.error("Missing --slug <blog-slug>");
		process.exit(1);
	}

	const localFile = argValue("--file") || argValue("-f");

	const row = await db
		.select({ id: blogs.id, slug: blogs.slug, coverImage: blogs.coverImage })
		.from(blogs)
		.where(eq(blogs.slug, slug))
		.limit(1);

	if (!row[0]) {
		console.error(`Blog not found for slug: ${slug}`);
		process.exit(1);
	}

	const current = row[0].coverImage?.trim() || "";

	let buf: Buffer;
	let ext: string;
	let contentType: string | undefined;
	let fromLabel: string;

	if (localFile) {
		const abs = path.isAbsolute(localFile)
			? localFile
			: path.join(process.cwd(), localFile);
		if (!fs.existsSync(abs)) {
			console.error(`Local file not found: ${abs}`);
			process.exit(1);
		}
		buf = fs.readFileSync(abs);
		ext = extFromFilePath(abs) || ".png";
		contentType = contentTypeFallbackFromExt(ext) || "application/octet-stream";
		fromLabel = abs;
		console.log(`[file] ${slug} coverImage source: ${abs}`);
	} else {
		if (!current) {
			console.log(`[skip] ${slug} has no coverImage and no --file provided`);
			return;
		}
		if (isVercelBlobUrl(current)) {
			console.log(`[skip] ${slug} coverImage already in Blob: ${current}`);
			return;
		}

		console.log(`[fetch] ${slug} coverImage: ${current}`);
		const res = await fetchWithRetry(current);
		buf = Buffer.from(await res.arrayBuffer());
		const ctHeader = res.headers.get("content-type");
		ext = extFromContentType(ctHeader) || extFromUrl(current) || ".jpg";
		contentType = ctHeader || contentTypeFallbackFromExt(ext);
		fromLabel = current;
	}

	const blobName = `cover-images/${slug}${ext}`;
	const blob = await put(blobName, buf, {
		access: "public",
		addRandomSuffix: false,
		allowOverwrite: true,
		...(contentType ? { contentType } : {}),
	});

	await db
		.update(blogs)
		.set({ coverImage: blob.url, updatedAt: new Date() })
		.where(eq(blogs.slug, slug));

	console.log(`[update] ${slug}\n  from: ${fromLabel}\n  to:   ${blob.url}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

