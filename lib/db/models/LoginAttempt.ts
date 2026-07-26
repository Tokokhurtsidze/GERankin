import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

// Durable audit log of login attempts. The live 3-strike cooldown counter itself
// lives in Upstash Redis (see lib/redis/login-rate-limit.ts) for atomic, fast
// increments — this collection is the persistent record for security review.
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
