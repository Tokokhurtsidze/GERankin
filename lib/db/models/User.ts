import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type UserRole = "founder" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  role: UserRole;
  provider: "credentials" | "google";
  emailVerified: Date | null;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // 1 user = 1 startup per tournament cycle; startup ref is set on registration
  startup?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: false },
    image: { type: String },
    role: { type: String, enum: ["founder", "admin"], default: "founder" },
    provider: { type: String, enum: ["credentials", "google"], default: "credentials" },
    emailVerified: { type: Date, default: null },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    startup: { type: Schema.Types.ObjectId, ref: "Startup", default: null },
  },
  { timestamps: true }
);

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
export default User;
