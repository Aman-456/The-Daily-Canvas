import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
	name: string;
	email: string;
	image?: string;
	role: "USER" | "ADMIN" | "SUBADMIN";
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		image: { type: String },
		role: {
			type: String,
			enum: ["USER", "ADMIN", "SUBADMIN"],
			default: "USER",
		},
	},
	{ timestamps: true },
);

// The model Name should be 'User' to map to the 'users' collection created by NextAuth
export default mongoose.models.User ||
	mongoose.model<IUser>("User", UserSchema);
