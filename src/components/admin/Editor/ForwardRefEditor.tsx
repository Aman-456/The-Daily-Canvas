"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { type MDXEditorMethods, type MDXEditorProps } from "@mdxeditor/editor";

// Dynamically import with SSR disabled — MDXEditor uses browser APIs
const Editor = dynamic(() => import("./InitializedMDXEditor"), { ssr: false });

interface ForwardRefEditorProps extends MDXEditorProps {
	imageUploadHandler?: (file: File) => Promise<string>;
}

export const ForwardRefEditor = forwardRef<
	MDXEditorMethods,
	ForwardRefEditorProps
>((props, ref) => <Editor {...props} editorRef={ref} />);

ForwardRefEditor.displayName = "ForwardRefEditor";
