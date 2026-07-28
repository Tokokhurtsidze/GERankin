import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

// Durable audit log of login attempts. Not currently written to or read from
// anywhere — Google OAuth is the sole auth provider, so there's no credentials
// form to brute-force yet. Keep this model honest: no Redis-backed rate limit
// exists. Wire one up (and start writing to this collection) before adding a
// credentials-based login flow.
export interface ILoginAttempt extends Document {
  _id: Types.ObjectId;
  email: string;
  ip: string;
  success: boolean;
  userAgent?: string;
  createdAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    ip: { type: String, required: true, index: true },
    success: { type: Boolean, required: true },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LoginAttemptSchema.index({ email: 1, createdAt: -1 });

export const LoginAttempt: Model<ILoginAttempt> =
  models.LoginAttempt || model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);
export default LoginAttempt;
