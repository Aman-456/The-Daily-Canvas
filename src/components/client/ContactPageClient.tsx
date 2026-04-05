"use client";

import Link from "next/link";
import { FadeIn } from "@/components/client/FadeIn";
import { ContactForm } from "@/components/client/ContactForm";

type ContactPageClientProps = {
	identityLocked?: boolean;
	prefilledName?: string | null;
	prefilledEmail?: string | null;
};

/** Static marketing copy for /contact (not CMS). */
export function ContactPageClient({
	identityLocked = false,
	prefilledName = null,
	prefilledEmail = null,
}: ContactPageClientProps) {
	return (
		<div className="container mx-auto max-w-lg space-y-10 py-5 md:py-10">
			<FadeIn>
				<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
					Contact us
				</h1>
				<p className="mt-3 text-muted-foreground">
					{identityLocked ? (
						<>
							You&apos;re signed in — your name and email are taken from your account.
							Only your message can be edited below.
						</>
					) : (
						<>
							Use the form below. We read every message; you don&apos;t need an account.
						</>
					)}
				</p>
			</FadeIn>

			<FadeIn>
				<ContactForm
					identityLocked={identityLocked}
					prefilledName={prefilledName ?? ""}
					prefilledEmail={prefilledEmail ?? ""}
				/>
			</FadeIn>

			<p className="text-sm text-muted-foreground">
				<Link href="/faq" className="font-medium text-primary hover:underline">
					FAQ
				</Link>
				{" · "}
				<Link href="/" className="font-medium text-primary hover:underline">
					Home
				</Link>
			</p>
		</div>
	);
}
