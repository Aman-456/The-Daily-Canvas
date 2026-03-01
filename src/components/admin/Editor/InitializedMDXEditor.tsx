"use client";

import type { ForwardedRef } from "react";
import {
	MDXEditor,
	type MDXEditorMethods,
	type MDXEditorProps,
	// Plugins
	headingsPlugin,
	listsPlugin,
	quotePlugin,
	thematicBreakPlugin,
	markdownShortcutPlugin,
	tablePlugin,
	linkPlugin,
	linkDialogPlugin,
	imagePlugin,
	codeBlockPlugin,
	codeMirrorPlugin,
	diffSourcePlugin,
	// Toolbar
	toolbarPlugin,
	UndoRedo,
	BoldItalicUnderlineToggles,
	StrikeThroughSupSubToggles,
	CodeToggle,
	CreateLink,
	InsertImage,
	InsertTable,
	InsertThematicBreak,
	InsertCodeBlock,
	ListsToggle,
	BlockTypeSelect,
	ChangeCodeMirrorLanguage,
	ConditionalContents,
	DiffSourceToggleWrapper,
	Separator,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

interface InitializedMDXEditorProps {
	editorRef: ForwardedRef<MDXEditorMethods> | null;
	imageUploadHandler?: (file: File) => Promise<string>;
}

export default function InitializedMDXEditor({
	editorRef,
	imageUploadHandler,
	...props
}: InitializedMDXEditorProps & MDXEditorProps) {
	return (
		<MDXEditor
			{...props}
			ref={editorRef}
			plugins={[
				headingsPlugin(),
				listsPlugin(),
				quotePlugin(),
				thematicBreakPlugin(),
				markdownShortcutPlugin(),
				tablePlugin(),
				linkPlugin(),
				linkDialogPlugin(),
				imagePlugin({
					imageUploadHandler: imageUploadHandler ?? (async () => ""),
				}),
				codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
				codeMirrorPlugin({
					codeBlockLanguages: {
						txt: "Plain text",
						html: "HTML",
						css: "CSS",
						js: "JavaScript",
						ts: "TypeScript",
						jsx: "JavaScript (React)",
						tsx: "TypeScript (React)",
						json: "JSON",
						bash: "Bash",
						sql: "SQL",
					},
				}),
				diffSourcePlugin({ viewMode: "rich-text" }),
				toolbarPlugin({
					toolbarContents: () => (
						<DiffSourceToggleWrapper>
							<UndoRedo />
							<Separator />
							<BlockTypeSelect />
							<Separator />
							<BoldItalicUnderlineToggles />
							<StrikeThroughSupSubToggles />
							<CodeToggle />
							<Separator />
							<ListsToggle />
							<Separator />
							<CreateLink />
							<InsertImage />
							<InsertTable />
							<InsertThematicBreak />
							<Separator />
							<ConditionalContents
								options={[
									{
										when: (editor) => editor?.editorType === "codeblock",
										contents: () => <ChangeCodeMirrorLanguage />,
									},
									{
										fallback: () => <InsertCodeBlock />,
									},
								]}
							/>
						</DiffSourceToggleWrapper>
					),
				}),
			]}
		/>
	);
}
