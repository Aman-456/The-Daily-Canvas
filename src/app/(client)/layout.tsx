import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth, signIn } from "@/auth";
import { UserNav } from "@/components/client/UserNav";

export default async function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	return (
		<div className="min-h-screen flex flex-col relative">
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link href="/" className="font-bold text-xl tracking-tight">
							Daily <span className="text-primary">Thoughts</span>
						</Link>
						<Link
							href="/about"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							About
						</Link>
					</div>

					<div className="flex items-center gap-4">
						{session?.user ? (
							<UserNav user={session.user} />
						) : (
							<form
								action={async () => {
									"use server";
									await signIn("google");
								}}
								className="flex items-center gap-2"
							>
								<Button type="submit" variant="ghost" size="sm">
									Sign In
								</Button>
							</form>
						)}
					</div>
				</div>
			</header>

			<main className="flex-1 container mx-auto px-4 py-8">{children}</main>

			<footer className="border-t py-8 mt-auto">
				<div className="container mx-auto px-4 flex flex-col items-center gap-4">
					<div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
						<Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
						<Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link>
					</div>
					<div className="text-sm text-muted-foreground text-center">
						&copy; {new Date().getFullYear()} Daily Thoughts. All rights reserved.
					</div>
				</div>
			</footer>
		</div>
	);
}
