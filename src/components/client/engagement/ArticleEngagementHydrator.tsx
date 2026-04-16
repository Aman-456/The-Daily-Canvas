"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getMyArticleVote } from "@/actions/vote";
import { ArticleEngagementBar } from "@/components/client/engagement/ArticleEngagementBar";

type VoteValue = 1 | -1 | 0;

export function ArticleEngagementHydrator(props: {
	blogId: string;
	slug: string;
	score: number;
	authorUserId: string | null | undefined;
	className?: string;
}) {
	const { data: session, status } = useSession();
	const viewerId = session?.user?.id ?? null;
	const isOwner = Boolean(viewerId && props.authorUserId && viewerId === props.authorUserId);

	const [myVote, setMyVote] = useState<VoteValue>(0);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			// Only fetch when we know user is logged in; otherwise keep 0.
			if (!viewerId) {
				setMyVote(0);
				return;
			}
			const res = await getMyArticleVote(props.blogId);
			if (cancelled) return;
			if (!res?.success) return;
			setMyVote((res.data?.myVote ?? 0) as VoteValue);
		})();
		return () => {
			cancelled = true;
		};
	}, [props.blogId, viewerId]);

	// Avoid a brief "vote/report" flash before we know if the viewer is the owner.
	const readyToRender = status !== "loading";

	if (!readyToRender) {
		return null;
	}

	// Logged out: no vote/report UI.
	if (!viewerId) {
		return null;
	}

	return (
		<ArticleEngagementBar
			score={props.score}
			myVote={myVote}
			blogId={props.blogId}
			slug={props.slug}
			isOwner={isOwner}
			className={props.className}
		/>
	);
}

export function OwnerVoteScoreInline(props: {
	score: number;
	authorUserId: string | null | undefined;
}) {
	const { data: session, status } = useSession();
	const viewerId = session?.user?.id ?? null;
	const isOwner = useMemo(
		() => Boolean(viewerId && props.authorUserId && viewerId === props.authorUserId),
		[viewerId, props.authorUserId],
	);

	if (status === "loading" || !isOwner) return null;

	return (
		<>
			<span className="text-[10px]">•</span>
			<span>{props.score} votes</span>
		</>
	);
}

