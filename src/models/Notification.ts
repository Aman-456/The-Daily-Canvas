import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
	message: string;
	link: string;
	blogLink: string;
	isRead: boolean;
	type: "COMMENT" | "SYSTEM" | "BLOG_PUBLISHED" | "BLOG_UNPUBLISHED" | "BLOG_UPDATE" | "BLOG_DELETE";
	userId: mongoose.Types.ObjectId;
	targetAuthorId?: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
	{
		message: { type: String, required: true },
		link: { type: String, required: true },
		blogLink: { type: String, required: true },
		isRead: { type: Boolean, default: false },
		type: { type: String, enum: ["COMMENT", "SYSTEM", "BLOG_PUBLISHED", "BLOG_UNPUBLISHED", "BLOG_UPDATE", "BLOG_DELETE"], default: "COMMENT" },
		userId: { type: Schema.Types.ObjectId, ref: "User" },
		targetAuthorId: { type: Schema.Types.ObjectId, ref: "User" },
	},
	{ timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
