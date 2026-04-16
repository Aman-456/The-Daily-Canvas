type Props = {
	count: number;
};

export function CommentThreadHeader({ count }: Props) {
	const label = count === 1 ? "comment" : "comments";

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
			<h3 className="text-lg font-bold tracking-tight md:text-xl">
				{count}{" "}
				<span className="font-semibold text-muted-foreground">{label}</span>
			</h3>
		</div>
	);
}
