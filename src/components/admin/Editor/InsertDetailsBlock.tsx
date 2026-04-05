"use client";

import {
	ButtonWithTooltip,
	iconComponentFor$,
	insertMarkdown$,
	useCellValue,
	usePublisher,
} from "@mdxeditor/editor";

/** Block HTML allowed by FAQ / CMS pages (rehype-raw) and MDXEditor import. */
const DETAILS_SNIPPET = `<details>
<summary>Question title</summary>

<p>Answer text goes here.</p>

</details>

`;

export function InsertDetailsBlock() {
	const insertMarkdown = usePublisher(insertMarkdown$);
	const iconComponentFor = useCellValue(iconComponentFor$);

	return (
		<ButtonWithTooltip
			title="Insert details block (accordion: details + summary)"
			onClick={() => insertMarkdown(DETAILS_SNIPPET)}
		>
			{iconComponentFor("admonition")}
		</ButtonWithTooltip>
	);
}
