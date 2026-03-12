"use client";

import { useState, useTransition, useEffect } from "react";
import { addComment, getComments } from "@/actions/comment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CommentItem } from "./CommentItem";
import { ChevronDown } from "lucide-react";
import { signIn } from "next-auth/react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { MessageSquarePlus } from "lucide-react";

interface CommentSectionProps {
	blogId: string;
	slug: string;
	initialComments: any[];
	initialHasMore: boolean;
	total: number;
	user: any;
	limit?: number;
	latestComment?: any;
}

export function CommentSection({
	blogId,
	slug,
	initialComments,
	initialHasMore,
	total,
	user,
	limit = 10,
	latestComment,
}: CommentSectionProps) {
	const [content, setContent] = useState("");
	const [comments, setComments] = useState(initialComments);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [isPending, startTransition] = useTransition();
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isLoaded, setIsLoaded] = useState(initialComments.length > 0);
	const [localTotal, setLocalTotal] = useState(total);

	// Sync with server data ONLY when blogId or total explicitly changes
	useEffect(() => {
		setLocalTotal(total);
	}, [total]);

	// Sync with server data ONLY when blogId changes to prevent accidental resets
	// initialComments from props is usually empty due to deferred loading
	useEffect(() => {
		if (isLoaded && comments.length > 0) return; // Already loaded, don't reset

		setComments(initialComments);
		setHasMore(initialHasMore);
		setPage(1);
		setIsLoaded(initialComments.length > 0);

		console.log("[CommentSection] BlogId changed or initial sync", {
			blogId,
			hasInitial: initialComments.length > 0,
		});
	}, [blogId]);

	const handleInitialLoad = async () => {
		setIsLoadingMore(true);
		try {
			const result = await getComments(blogId, 1, limit);
			console.log("[CommentSection] Initial load", result);
			if (result.success && result.data) {
				setComments(result.data.comments);
				setHasMore(result.data.hasMore);
				setPage(1);
				setIsLoaded(true);
			}
		} catch (error) {
			toast.error("Failed to load responses");
		} finally {
			setIsLoadingMore(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		if (!user) {
			toast.error("Please login to comment");
			return;
		}

		startTransition(async () => {
			try {
				const formData = new FormData();
				formData.append("content", content);
				formData.append("blogId", blogId);
				formData.append("slug", slug);

				const result = await addComment(formData);
				if (result.success && result.data) {
					setContent("");
					toast.success("Comment posted!");
					// Optimistically update total
					setLocalTotal((prev) => prev + 1);
					// Optimistically add the new comment to the list if loaded
					if (isLoaded) {
						setComments((prev) => [result.data, ...prev]);
					} else {
						// If not loaded yet, just load the first page to show the new comment
						handleInitialLoad();
					}
				} else {
					toast.error(result.error || "Failed to post comment");
				}
			} catch (error: any) {
				toast.error("An unexpected error occurred");
			}
		});
	};

	const handleLoadMore = async () => {
		setIsLoadingMore(true);
		try {
			const nextPage = page + 1;
			const lastTimestamp =
				comments.length > 0
					? comments[comments.length - 1].createdAt
					: undefined;
			console.log("[CommentSection] Loading more", { nextPage, limit, blogId });
			const result = await getComments(blogId, nextPage, limit, lastTimestamp);

			if (result.success && result.data) {
				const newComments = result.data.comments;
				setComments((prev) => {
					const existingIds = new Set(prev.map((c) => c._id));
					const uniqueNew = newComments.filter(
						(c: any) => !existingIds.has(c._id),
					);
					return [...prev, ...uniqueNew];
				});
				setHasMore(result.data.hasMore);
				setPage(nextPage);
			} else {
				toast.error(result.error || "Failed to load more comments");
			}
		} catch (error) {
			toast.error("An error occurred while loading more comments");
		} finally {
			setIsLoadingMore(false);
		}
	};

	const handleDelete = (commentId: string) => {
		setComments((prev) => prev.filter((c) => c._id !== commentId));
		// localTotal is updated via onTotalChange callback from CommentItem
	};

	if (!isLoaded) {
		return (
			<div className="mt-12 space-y-8 max-w-3xl mx-auto">
				<div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 group">
					<div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
						<ChevronDown className="h-8 w-8 text-primary animate-bounce-slow" />
					</div>
					<h3 className="text-xl font-bold mb-2">Community Discussion</h3>
					<p className="text-muted-foreground text-center mb-6 max-w-md">
						{localTotal > 0
							? localTotal === 1
								? "Join the conversation. There is 1 response waiting for you."
								: `Join the conversation. There are ${localTotal} responses waiting for you.`
							: "No responses yet. Be the first to share your thoughts!"}
					</p>
					<Button
						onClick={handleInitialLoad}
						disabled={isLoadingMore}
						size="lg"
						className={cn(
							"rounded-full px-8 shadow-lg hover:shadow-xl transition-all font-semibold",
							!isLoadingMore && "cursor-pointer",
						)}
					>
						{isLoadingMore
							? "Loading conversation..."
							: localTotal === 1
								? "View full discussion"
								: "Show all responses"}
					</Button>

					{latestComment && !isLoadingMore && (
						<div className="mt-8 w-full max-w-md bg-background/50 backdrop-blur-sm rounded-xl p-5 border border-primary/10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 hover:border-primary/20 transition-colors">
							<div className="flex items-start gap-3 mb-4">
								<Avatar className="h-9 w-9 border">
									<AvatarImage src={latestComment.userId?.image} />
									<AvatarFallback>
										{latestComment.userId?.name?.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 overflow-hidden">
									<div className="flex items-center justify-between mb-1">
										<p className="text-xs font-bold text-primary">
											Latest response from {latestComment.userId?.name}
										</p>
										<span className="text-[10px] text-muted-foreground font-medium">
											{formatRelativeTime(latestComment.createdAt)}
										</span>
									</div>
									<p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
										"{latestComment.content.replace(/^"|"$/g, "")}"
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="w-full justify-center gap-2 text-xs font-bold hover:bg-primary/5 hover:text-primary transition-all rounded-lg group/btn cursor-pointer"
								onClick={async () => {
									if (!isLoaded) await handleInitialLoad();
									setTimeout(() => {
										document
											.getElementById("comment-form")
											?.scrollIntoView({ behavior: "smooth" });
									}, 100);
								}}
							>
								<MessageSquarePlus className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
								Add your response
							</Button>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="mt-12 space-y-10 max-w-3xl mx-auto" id="comments">
			<div className="flex items-center justify-between border-b pb-6">
				<div className="flex items-center gap-4">
					<h3 className="text-2xl font-black tracking-tight">
						{localTotal === 1 ? "Response" : "Responses"}{" "}
						<span className="text-muted-foreground ml-1.5 font-bold">
							({localTotal})
						</span>
					</h3>
					<Button
						variant="secondary"
						size="sm"
						className="rounded-full h-8 px-4 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
						onClick={() =>
							document
								.getElementById("comment-form")
								?.scrollIntoView({ behavior: "smooth" })
						}
					>
						Add response
					</Button>
				</div>
				<div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground font-medium">
					<span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
					Discussion Active
				</div>
			</div>

			{/* Comments List */}
			<div className="space-y-4">
				{comments.length > 0 ? (
					<>
						<div className="space-y-8">
							{comments.map((comment) => (
								<CommentItem
									key={comment._id}
									comment={comment}
									blogId={blogId}
									slug={slug}
									user={user}
									onDelete={() => handleDelete(comment._id)}
									onTotalChange={(delta) =>
										setLocalTotal((prev) => Math.max(0, prev + delta))
									}
								/>
							))}
						</div>

						{hasMore && (
							<div className="pt-8 flex justify-center border-t mt-8">
								<Button
									variant="outline"
									onClick={handleLoadMore}
									disabled={isLoadingMore}
									className="rounded-full px-10 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all font-bold cursor-pointer"
								>
									{isLoadingMore ? "Loading more..." : "Load deeper responses"}
								</Button>
							</div>
						)}
					</>
				) : (
					<div className="py-20 text-center bg-muted/10 rounded-3xl border border-dashed text-sm">
						<p className="text-muted-foreground italic font-medium">
							The conversation hasn't started yet. Be the first to join!
						</p>
					</div>
				)}
			</div>

			{/* Comment Form moved to bottom */}
			<div id="comment-form" className="scroll-mt-20 pt-10 border-t">
				<h4 className="text-lg font-bold mb-6">Leave a response</h4>
				{user ? (
					<form
						onSubmit={handleSubmit}
						className="bg-card rounded-2xl p-6 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-sm"
					>
						<div className="flex gap-4">
							<Avatar className="hidden sm:block h-10 w-10 border border-muted-foreground/20">
								<AvatarImage src={user.image || ""} alt={user.name || "User"} />
								<AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-4">
								<Textarea
									placeholder="What are your thoughts?"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									className="min-h-[120px] bg-muted/20 border focus-visible:ring-1 focus-visible:ring-primary/30 text-base resize-none"
								/>
								<div className="flex justify-end pt-2">
									<Button
										type="submit"
										disabled={isPending || !content.trim()}
										className="rounded-full px-8 font-bold shadow-md hover:shadow-xl transition-all"
									>
										{isPending ? "Posting..." : "Post Response"}
									</Button>
								</div>
							</div>
						</div>
					</form>
				) : (
					<div className="bg-muted/30 border-2 border-dashed rounded-2xl p-10 text-center shadow-inner">
						<p className="text-muted-foreground mb-4 font-medium">
							Sign in to join the discussion and share your perspective.
						</p>
						<Button
							variant="outline"
							className="rounded-full px-8 font-bold border-2"
							onClick={() => signIn("google")}
						>
							Sign In to Comment
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
