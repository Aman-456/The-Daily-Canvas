import { ContactPageClient } from "@/components/client/ContactPageClient";
import { JsonLd } from "@/components/seo/JsonLd";
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

export default function ContactPage() {
	return (
		<>
			<ContactPageClient />
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
