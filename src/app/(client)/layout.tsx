import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth, signIn, signOut } from "@/auth";
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
							The Daily <span className="text-primary">Canvas</span>
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
				<div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
					&copy; {new Date().getFullYear()} The Daily Canvas. All rights
					reserved.
				</div>
			</footer>
		</div>
	);
}
