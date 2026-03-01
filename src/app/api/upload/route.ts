import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
	} catch (error: any) {
		console.error("Upload failed:", error);
		return NextResponse.json(
			{ error: error.message || "Upload failed" },
			{ status: 500 },
		);
	}
}
