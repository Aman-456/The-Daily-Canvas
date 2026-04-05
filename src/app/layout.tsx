import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { JsonLd } from "@/components/seo/JsonLd";
import { sitewideJsonLdGraph } from "@/lib/json-ld";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});
const manrope = Manrope({
	subsets: ["latin"],
	variable: "--font-manrope",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
	title: "Daily Thoughts",
	description:
		"Daily Thoughts - Explore thought-provoking blogs, inspirational stories, and creative writing on life, art, and personal growth. Stay inspired with fresh daily articles designed to spark curiosity and reflection.",
	keywords: ["blog", "daily thoughts", "inspiration", "stories", "articles", "writing"],
	alternates: {
		canonical: "/",
	},
	// Robots & verification
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
		},
	},
	verification: {
		google: "EUn9Qi_wd8C7ZLE6DZELjr87BvGSBIWKAaFoDZHauqQ",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${inter.variable} ${manrope.variable}`}
			suppressHydrationWarning
		>
			<body
				className={`${inter.className} min-h-screen bg-background font-sans antialiased`}
			>
				<ThemeProvider>
					<AuthProvider>
						<NextTopLoader
							height={4}
							showSpinner={true}
							color="var(--sidebar-ring)"
							showForHashAnchor={false}
							
						/>
						{children}
						<Toaster />
						<JsonLd data={sitewideJsonLdGraph()} />
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
