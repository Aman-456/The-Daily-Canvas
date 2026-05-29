import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const limit = await rateLimit(`upload:${session.user.id}`, 30, 3600);
	if (!limit.success) {
		return NextResponse.json(
			{ error: "Too many uploads. Please try again later." },
			{ status: 429, headers: { "Retry-After": String(limit.reset) } },
		);
	}

	const formData = await request.formData();
	const file = formData.get("file") as File | null;

	if (!file) {
		return NextResponse.json({ error: "No file provided" }, { status: 400 });
	}

	// Validate file type
	const allowedTypes = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/avif",
	];
	if (!allowedTypes.includes(file.type)) {
		return NextResponse.json(
			{ error: "Invalid file type. Only images are allowed." },
			{ status: 400 },
		);
	}

	// Validate file size (max 4.5 MB — Vercel Blob free tier limit)
	const maxSize = 4.5 * 1024 * 1024;
	if (file.size > maxSize) {
		return NextResponse.json(
			{ error: "File too large. Maximum size is 4.5 MB." },
			{ status: 400 },
		);
	}

	try {
		const blob = await put(file.name, file, {
			access: "public",
		});

		return NextResponse.json({ url: blob.url });
	} catch (error) {
		console.error("Upload failed:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Upload failed" },
			{ status: 500 },
		);
	}
}
