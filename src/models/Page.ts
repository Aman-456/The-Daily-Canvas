import mongoose, { Schema, Document } from "mongoose";

export interface IPage extends Document {
	title: string;
	slug: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
	{
		title: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, index: true },
		content: { type: String, required: true },
	},
	{ timestamps: true }
);

export default mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);
