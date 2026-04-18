"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getArticleScore, getArticleVoteState } from "@/actions/vote";
import { ArticleEngagementBar } from "@/components/client/engagement/ArticleEngagementBar";

type VoteValue = 1 | -1 | 0;

export function ArticleEngagementHydrator(props: {
	blogId: string;
	slug: string;
	authorUserId: string | null | undefined;
	className?: string;
}) {
	const { data: session, status } = useSession();
	const viewerId = session?.user?.id ?? null;
	const isOwner = Boolean(
		viewerId && props.authorUserId && viewerId === props.authorUserId,
	);

	const [score, setScore] = useState<number | null>(null);
	const [myVote, setMyVote] = useState<VoteValue>(0);

	useEffect(() => {
		// Only fetch when the bar will actually render: logged-in, non-owner.
		if (status === "loading") return;
		if (!viewerId || isOwner) return;

		let cancelled = false;
		(async () => {
			const res = await getArticleVoteState(props.blogId);
			if (cancelled || !res?.success) return;
			setScore(res.data.score);
			setMyVote((res.data.myVote ?? 0) as VoteValue);
		})();
		return () => {
			cancelled = true;
		};
	}, [props.blogId, viewerId, isOwner, status]);

	if (status === "loading") return null;
	if (!viewerId || isOwner) return null;
	if (score === null) return null;

	return (
		<ArticleEngagementBar
			score={score}
			myVote={myVote}
			blogId={props.blogId}
			slug={props.slug}
			isOwner={isOwner}
			className={props.className}
		/>
	);
}

/**
 * Shown only to the article's author in the byline. Fetches the cached public
 * score on mount; renders nothing for all other viewers.
 */
export function OwnerVoteScoreInline(props: {
	blogId: string;
	authorUserId: string | null | undefined;
}) {
	const { data: session, status } = useSession();
	const viewerId = session?.user?.id ?? null;
	const isOwner = useMemo(
		() =>
			Boolean(
				viewerId && props.authorUserId && viewerId === props.authorUserId,
			),
		[viewerId, props.authorUserId],
	);

	const [score, setScore] = useState<number | null>(null);

	useEffect(() => {
		if (status === "loading" || !isOwner) return;

		let cancelled = false;
		(async () => {
			const res = await getArticleScore(props.blogId);
			if (cancelled || !res?.success) return;
			setScore(res.data.score);
		})();
		return () => {
			cancelled = true;
		};
	}, [props.blogId, isOwner, status]);

	if (status === "loading" || !isOwner || score === null) return null;

	return (
		<>
			<span className="text-[10px]">•</span>
			<span>{score} votes</span>
		</>
	);
}
