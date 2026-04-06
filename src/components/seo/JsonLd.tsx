// /**
//  * Emits a single JSON-LD script. Pass either a full object (with @context) or an array of
//  * nodes to wrap as @graph.
//  */
// import Script from "next/script";
// import { createHash } from "crypto";

// export function JsonLd({
// 	data,
// }: {
// 	data: Record<string, unknown> | Record<string, unknown>[];
// }) {
// 	const payload = Array.isArray(data)
// 		? { "@context": "https://schema.org", "@graph": data }
// 		: data;

// 	const json = JSON.stringify(payload).replace(/</g, "\\u003c");
// 	const id = `jsonld-${createHash("sha1").update(json).digest("hex").slice(0, 12)}`;
//  	return (
//  			<Script
// 				id={id}
// 				type="application/ld+json"
// 				strategy="beforeInteractive"
// 				dangerouslySetInnerHTML={{ __html: json }}
// 			/>
//  	);
// }

/**
 * Emits a single JSON-LD script. Pass either a full object (with @context) or an array of
 * nodes to wrap as @graph.
 */
import Script from "next/script";
import { createHash } from "crypto";

export function JsonLd({
	data,
}: {
	data: Record<string, unknown> | Record<string, unknown>[];
}) {
	const payload = Array.isArray(data)
		? { "@context": "https://schema.org", "@graph": data }
		: data;

	const json = JSON.stringify(payload).replace(/</g, "\\u003c");
	const id = `jsonld-${createHash("sha1").update(json).digest("hex").slice(0, 12)}`;
 	return (
 			<Script
				id={id}
				type="application/ld+json"
				strategy="beforeInteractive"
				dangerouslySetInnerHTML={{ __html: json }}
			/>
 	);
}

