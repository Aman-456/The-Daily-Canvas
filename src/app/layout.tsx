import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Daily Thoughts",
	description:
		"Discover daily inspiration, creative stories, and insightful articles on Daily Thoughts.",
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
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${outfit.className} antialiased min-h-screen bg-background font-sans`}
			>
				<AuthProvider>
					{children}
					<Toaster />
				</AuthProvider>
			</body>
		</html>
	);
}
