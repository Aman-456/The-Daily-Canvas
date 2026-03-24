import mongoose, { Schema, Document } from "mongoose";

export interface IPermissions {
	canSeeStats: boolean;
	canManageBlogs: boolean;
	canManageComments: boolean;
	canManagePages: boolean;
	canManageUsers: boolean;
}

export interface IUser extends Document {
	name: string;
	email: string;
	image?: string;
	role: "USER" | "ADMIN";
	permissions?: IPermissions;
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
			enum: ["USER", "ADMIN"],
			default: "USER",
		},
		permissions: {
			canSeeStats: { type: Boolean, default: false },
			canManageBlogs: { type: Boolean, default: true },
			canManageComments: { type: Boolean, default: true },
			canManagePages: { type: Boolean, default: false },
			canManageUsers: { type: Boolean, default: false },
		},
	},
	{ timestamps: true },
);

// The model Name should be 'User' to map to the 'users' collection created by NextAuth
export default mongoose.models.User ||
	mongoose.model<IUser>("User", UserSchema);
