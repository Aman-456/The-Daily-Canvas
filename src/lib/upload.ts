import { del } from "@vercel/blob";

/**
 * UploadService — handles image optimization, upload to Vercel Blob, and deletion.
 *
 * Usage (client-side):
 *   const optimized = await UploadService.optimizeImage(file);
 *   const url = await UploadService.upload(optimized);
 *
 * Usage (server-side, in actions):
 *   await UploadService.delete(oldUrl);
 */
export class UploadService {
	private static readonly MAX_WIDTH = 1200;
	private static readonly QUALITY = 0.8;

	/**
	 * Optimize an image client-side: resize to MAX_WIDTH and compress as WebP.
	 * Must be called in a browser environment.
	 */
	static async optimizeImage(file: File): Promise<File> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const url = URL.createObjectURL(file);

			img.onload = () => {
				URL.revokeObjectURL(url);

				let { width, height } = img;

				// Only downscale, never upscale
				if (width > UploadService.MAX_WIDTH) {
					height = Math.round((height * UploadService.MAX_WIDTH) / width);
					width = UploadService.MAX_WIDTH;
				}

				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to get canvas context"));
					return;
				}

				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error("Failed to compress image"));
							return;
						}

						const optimizedFile = new File(
							[blob],
							file.name.replace(/\.[^.]+$/, ".webp"),
							{ type: "image/webp" },
						);
						resolve(optimizedFile);
					},
					"image/webp",
					UploadService.QUALITY,
				);
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error("Failed to load image for optimization"));
			};

			img.src = url;
		});
	}

	/**
	 * Upload an image file via the /api/upload route.
	 * Returns the public blob URL.
	 */
	static async upload(file: File): Promise<string> {
		const formData = new FormData();
		formData.append("file", file);

		const response = await fetch("/api/upload", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to upload image");
		}

		const data = await response.json();
		return data.url;
	}

	/**
	 * Delete a blob by its URL. Server-side only.
	 * Silently ignores non-blob URLs or already-deleted blobs.
	 */
	static async delete(url: string): Promise<void> {
		if (!url || !url.includes("vercel-storage.com")) return;

		try {
			await del(url);
		} catch {
			// Blob may already be deleted — ignore
			console.warn(`Failed to delete blob: ${url}`);
		}
	}
}
