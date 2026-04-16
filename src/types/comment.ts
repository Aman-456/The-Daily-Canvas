/** Public comment shape returned by getBlogComments / getCommentReplies + addComment */

export type CommentAuthor = {
	_id: string;
	name: string | null;
	image: string | null;
};

export type PublicComment = {
	_id: string;
	id?: string;
	content: string;
	blogId: string;
	parentId: string | null;
	isApproved: boolean;
	isEdited: boolean;
	isDeleted: boolean;
	isHidden?: boolean;
	createdAt: string | Date;
	updatedAt?: string | Date | null;
	userId: CommentAuthor | null;
	replies?: PublicComment[];
	/** Omitted on some preview payloads (e.g. latest-comment teaser). */
	replyCount?: number;
	voteScore?: number;
	myVote?: 1 | -1 | 0;
};
