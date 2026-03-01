import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
	content: string;
	blogId: mongoose.Types.ObjectId | string;
	userId: mongoose.Types.ObjectId | string;
	parentId: mongoose.Types.ObjectId | string | null;
	isApproved: boolean;
	isEdited: boolean;
	isDeleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
	{
		content: { type: String, required: true, trim: true },
		blogId: {
			type: Schema.Types.ObjectId,
			ref: "Blog",
			required: true,
			index: true,
		},
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		parentId: {
			type: Schema.Types.ObjectId,
			ref: "Comment",
			default: null,
			index: true,
		},
		isApproved: { type: Boolean, default: true },
		isEdited: { type: Boolean, default: false },
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

export default mongoose.models.Comment ||
	mongoose.model<IComment>("Comment", CommentSchema);
