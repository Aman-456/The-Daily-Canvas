import { ContactPageClient } from "@/components/client/ContactPageClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { auth } from "@/auth";
import {
	breadcrumbListJsonLd,
	jsonLdGraph,
	webPageJsonLd,
} from "@/lib/json-ld";

export const metadata = {
	title: "Contact us | Daily Thoughts",
	description:
		"Send a message to the Daily Thoughts team — feedback, editorial questions, or reader notes.",
	keywords: ["contact", "daily thoughts", "editorial"],
	alternates: {
		canonical: "/contact",
	},
	openGraph: {
		title: "Contact us | Daily Thoughts",
		description:
			"Send a message to the Daily Thoughts team — feedback, editorial questions, or reader notes.",
		images: [{ url: "/favicon.ico" }],
	},
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
	const session = await auth();
	const u = session?.user;
	const sessionEmail = u?.email?.trim() ?? null;
	const prefilledName =
		(u?.name?.trim() && u.name.trim().length > 0
			? u.name.trim()
			: sessionEmail
				? sessionEmail.split("@")[0]
				: null) ?? null;

	return (
		<>
			<ContactPageClient
				identityLocked={!!sessionEmail}
				prefilledName={prefilledName}
				prefilledEmail={sessionEmail}
			/>
			<JsonLd
				data={jsonLdGraph([
					webPageJsonLd({
						name: "Contact us | Daily Thoughts",
						description:
							"Contact Daily Thoughts for feedback, editorial questions, or reader notes.",
						path: "/contact",
					}),
					breadcrumbListJsonLd([
						{ name: "Home", item: "/" },
						{ name: "Contact", item: "/contact" },
					]),
				])}
			/>
		</>
	);
}
