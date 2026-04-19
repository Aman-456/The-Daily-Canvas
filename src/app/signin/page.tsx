"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import type { SignInResponse } from "next-auth/react";
import { clearSessionCache } from "nextauth-session-dedupe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type ProvidersMap = Record<string, { id: string; name: string }> | null;

/** Maps Auth.js `error` query values to readable copy. */
function mapAuthError(error: string, code: string | null): string {
	if (error === "CredentialsSignin" && code === "account_disabled") {
		return "This account has been disabled. Contact an administrator if you think this is a mistake.";
	}
	switch (error) {
		case "CredentialsSignin":
			return "Invalid email or password.";
		case "AccessDenied":
			return "Your account cannot sign in. It may be disabled or not allowed.";
		case "Configuration":
			return "Sign-in hit a server configuration error. If this persists, contact the site administrator.";
		case "OAuthAccountNotLinked":
			return "This sign-in method is not linked to your account. Sign in with the method you used before.";
		case "OAuthCallbackError":
		case "OAuthSignInError":
			return "We could not complete sign-in with the provider. Please try again.";
		case "OAuthCreateAccount":
			return "Could not create your account. Please try again.";
		case "EmailSignInError":
			return "Could not send the sign-in email.";
		case "SessionRequired":
			return "You need to sign in to access that page.";
		default:
			return code ? `Sign-in failed (${error}, ${code}).` : `Sign-in failed (${error}).`;
	}
}

function SignInFallback() {
	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md rounded-2xl border bg-background shadow-sm p-8 text-sm text-muted-foreground">
				Loading sign-in…
			</div>
		</div>
	);
}

function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? "/";

	const [providers, setProviders] = useState<ProvidersMap>(null);
	/** Avoid flashing “not configured” while `getProviders()` is in flight (`providers === null` means unknown, not absent). */
	const [providersLoaded, setProvidersLoaded] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		getProviders()
			.then((p) => {
				if (alive) {
					setProviders(p);
					setProvidersLoaded(true);
				}
			})
			.catch(() => {
				if (alive) {
					setProviders(null);
					setProvidersLoaded(true);
				}
			});
		return () => {
			alive = false;
		};
	}, []);

	/** OAuth and other flows redirect back with `?error=` (and optional `code=`). */
	useEffect(() => {
		const err = searchParams.get("error");
		if (!err) return;

		const code = searchParams.get("code");
		setError(mapAuthError(err, code));

		const next = new URLSearchParams(searchParams.toString());
		next.delete("error");
		next.delete("code");
		const qs = next.toString();
		router.replace(qs ? `/signin?${qs}` : "/signin");
	}, [searchParams, router]);

	const hasGoogle = !!providers?.google;
	const hasCredentials = !!providers?.credentials;

	async function onCredentialsSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);
		try {
			const res = (await signIn("credentials", {
				email,
				password,
				redirect: false,
				callbackUrl,
			})) as SignInResponse | undefined;

			if (!res) {
				setError("Could not reach the sign-in service. Please try again.");
				return;
			}

			// Failed sign-in often returns HTTP 200 with `error` in the redirect URL; `res.ok` is the
			// fetch status, not “signed in successfully”. Check `res.error` before redirecting.
			if (res.error) {
				setError(mapAuthError(res.error, res.code ?? null));
				return;
			}

			if (res.ok) {
				// Drop the fetch-layer session cache so any render that happens
				// before the full-page navigation reads the newly authenticated
				// session instead of a stale "signed out" response.
				clearSessionCache();
				window.location.href = res.url ?? callbackUrl;
				return;
			}

			setError("Sign-in failed. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function onGoogleSignIn() {
		setError(null);
		setGoogleLoading(true);
		try {
			// Auth.js v5 does not support GET /api/auth/signin/{provider} (it throws UnknownAction).
			// OAuth must start via the client signIn() POST flow.
			await signIn("google", { callbackUrl });
		} finally {
			setGoogleLoading(false);
		}
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md rounded-2xl border bg-background shadow-sm">
				<div className="p-6 sm:p-8 space-y-6">
					<div className="space-y-2">
						<h1 className="text-2xl font-black tracking-tight">Sign in</h1>
						<p className="text-sm text-muted-foreground">
							Continue to the admin panel or post comments.
						</p>
					</div>

					{error && (
						<div
							className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium"
							role="alert"
						>
							{error}
						</div>
					)}

					{!providersLoaded ? (
						<p className="text-sm text-muted-foreground">Loading sign-in options…</p>
					) : (
						<>
							{hasGoogle && (
								<Button
									type="button"
									className="w-full"
									variant="secondary"
									disabled={googleLoading}
									onClick={() => void onGoogleSignIn()}
								>
									{googleLoading ? "Redirecting…" : "Sign in with Google"}
								</Button>
							)}

							{hasGoogle && hasCredentials && (
								<div className="flex items-center gap-3">
									<div className="h-px flex-1 bg-border" />
									<span className="text-xs text-muted-foreground font-medium">OR</span>
									<div className="h-px flex-1 bg-border" />
								</div>
							)}

							{hasCredentials ? (
								<form onSubmit={onCredentialsSubmit} className="space-y-4">
									<div className="space-y-2">
										<label className="text-sm font-semibold">Email</label>
										<Input
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="admin@example.com"
											autoComplete="email"
											required
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-semibold">Password</label>
										<Input
											type="password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											placeholder="••••••••"
											autoComplete="current-password"
											required
										/>
									</div>

									<Button type="submit" className="w-full" disabled={isSubmitting}>
										{isSubmitting ? "Signing in..." : "Sign in"}
									</Button>

									<p className="text-xs text-muted-foreground">
										Email sign-in is enabled when{" "}
										<code className="text-[0.7rem]">DEV_ADMIN_EMAIL</code> and{" "}
										<code className="text-[0.7rem]">DEV_ADMIN_PASSWORD</code> are set in the
										server environment.
									</p>
								</form>
							) : (
								<p className="text-sm text-muted-foreground">
									Email and password sign-in is not configured. Set{" "}
									<code className="text-xs">DEV_ADMIN_EMAIL</code> and{" "}
									<code className="text-xs">DEV_ADMIN_PASSWORD</code> in the server environment
									to enable it.
								</p>
							)}
						</>
					)}

					<div className="pt-2 text-sm">
						<Link href="/" className="text-primary hover:underline">
							Back to home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={<SignInFallback />}>
			<SignInForm />
		</Suspense>
	);
}
