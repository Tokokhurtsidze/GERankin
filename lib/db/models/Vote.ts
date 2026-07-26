import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IVote extends Document {
  _id: Types.ObjectId;
  match: Types.ObjectId;
  voter: Types.ObjectId; // User ref — must be email-verified before voting
  side: "A" | "B";
  turnstileVerified: boolean;
  ip: string;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    voter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    side: { type: String, enum: ["A", "B"], required: true },
    turnstileVerified: { type: Boolean, required: true },
    ip: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One vote per user per match.
VoteSchema.index({ match: 1, voter: 1 }, { unique: true });

export const Vote: Model<IVote> = models.Vote || model<IVote>("Vote", VoteSchema);
export default Vote;
