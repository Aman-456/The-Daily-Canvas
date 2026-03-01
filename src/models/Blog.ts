import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
	title: string;
	slug: string;
	content: string;
	excerpt?: string;
	coverImage?: string;
	authorId: mongoose.Types.ObjectId | string;
	isPublished: boolean;
	tags: string[];
	metaTitle?: string;
	metaDescription?: string;
	keywords?: string[];
	commentsCount: number;
	createdAt: Date;
	updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
	{
		title: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, index: true },
		content: { type: String, required: true },
		excerpt: { type: String },
		coverImage: { type: String },
		authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		isPublished: { type: Boolean, default: false },
		tags: [{ type: String }],
		metaTitle: { type: String, trim: true },
		metaDescription: { type: String, trim: true },
		keywords: [{ type: String }],
		commentsCount: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

export default mongoose.models.Blog ||
	mongoose.model<IBlog>("Blog", BlogSchema);
