"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { CommentItem } from "@/components/client/comments/CommentItem";
import type { PublicComment } from "@/types/comment";
import type { Session } from "next-auth";

export type CommentThreadPermalinkProps = {
	blogId: string;
	slug: string;
	blogTitle: string;
	blogAuthorId?: string;
	initialComment: PublicComment;
	initialSessionUser?: Session["user"] | null;
};

export function CommentThreadPermalink({
	blogId,
	slug,
	blogTitle,
	blogAuthorId,
	initialComment,
	initialSessionUser = null,
}: CommentThreadPermalinkProps) {
	const { data: session, status } = useSession();
	const sessionUser = useMemo(() => {
		if (status === "unauthenticated") return undefined;
		if (session?.user?.id) return session.user;
		if (initialSessionUser?.id) return initialSessionUser;
		return undefined;
	}, [session?.user, initialSessionUser, status]);

	return (
		<section
			className="mx-auto mt-8 max-w-3xl scroll-mt-24 space-y-6 px-2 sm:px-0"
			aria-label="Comment thread"
		>
			<nav className="text-sm text-muted-foreground">
				<Link href="/" className="hover:text-foreground hover:underline">
					Home
				</Link>
				<span className="px-1.5">/</span>
				<Link
					href={`/articles/${slug}`}
					className="hover:text-foreground hover:underline"
				>
					{blogTitle}
				</Link>
				<span className="px-1.5">/</span>
				<span className="text-foreground">Thread</span>
			</nav>

			<p className="text-sm text-muted-foreground">
				You are viewing a single comment thread.{" "}
				<Link
					href={`/articles/${slug}#comments`}
					className="font-medium text-primary underline-offset-4 hover:underline"
				>
					See all comments on this post
				</Link>
				.
			</p>

			<CommentItem
				comment={initialComment}
				blogId={blogId}
				slug={slug}
				user={sessionUser}
				depth={0}
				blogAuthorId={blogAuthorId}
				hidePermalink
			/>
		</section>
	);
}
