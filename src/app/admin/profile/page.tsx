import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateUserProfile } from "@/actions/user";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function saveProfile(formData: FormData) {
	"use server";
	await updateUserProfile(formData);
}

export default async function AdminProfilePage() {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(`/signin?callbackUrl=${encodeURIComponent("/admin/profile")}`);
	}

	const u = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
	});
	if (!u) {
		redirect("/signin");
	}

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Your profile"
				description="Set your public author identity (username is permanent once saved)."
			/>

			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle className="text-base">Public author profile</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={saveProfile} className="space-y-5">
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="name">
								Display name
							</label>
							<Input
								id="name"
								name="name"
								defaultValue={u.name ?? ""}
								placeholder="Your name"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="username">
								Username
							</label>
							<Input
								id="username"
								name="username"
								defaultValue={u.username ?? ""}
								placeholder="e.g. aman"
								disabled={Boolean(u.username)}
							/>
							<p className="text-xs text-muted-foreground">
								Public URL: <span className="font-mono">/u/{u.username ?? "{username}"}</span>
							</p>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="bio">
								Bio
							</label>
							<Textarea
								id="bio"
								name="bio"
								defaultValue={u.bio ?? ""}
								placeholder="A short bio shown on your author page."
								className="min-h-28"
							/>
						</div>

						<div className="flex items-center gap-3">
							<Button type="submit">Save</Button>
							<p className="text-xs text-muted-foreground">
								Changes may take a moment to appear across cached pages.
							</p>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

