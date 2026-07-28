import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type MatchStatus = "pending" | "live" | "overtime" | "completed" | "bye";

export interface IMatch extends Document {
  _id: Types.ObjectId;
  tournament: Types.ObjectId;
  round: number; // 1-indexed
  slot: number; // position within round, 0-indexed, used to derive next match slot
  startupA?: Types.ObjectId; // undefined until previous round resolves
  startupB?: Types.ObjectId;
  votesA: number;
  votesB: number;
  status: MatchStatus;
  startsAt: Date;
  endsAt: Date;
  // Tie-breaker: when votesA === votesB at endsAt
  overtimesUsed: number; // how many overtime periods this match has gone through
  overtimeEndsAt?: Date;
  firstVoteAAt?: Date; // earliest vote timestamp per side, used for early-vote priority tie-break
  firstVoteBAt?: Date;
  winner?: Types.ObjectId;
  nextMatch?: Types.ObjectId; // match this winner advances into
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    tournament: { type: Schema.Types.ObjectId, ref: "Tournament", required: true, index: true },
    round: { type: Number, required: true },
    slot: { type: Number, required: true },
    startupA: { type: Schema.Types.ObjectId, ref: "Startup" },
    startupB: { type: Schema.Types.ObjectId, ref: "Startup" },
    votesA: { type: Number, default: 0 },
    votesB: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "live", "overtime", "completed", "bye"],
      default: "pending",
      index: true,
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    overtimesUsed: { type: Number, default: 0 },
    overtimeEndsAt: { type: Date },
    firstVoteAAt: { type: Date },
    firstVoteBAt: { type: Date },
    winner: { type: Schema.Types.ObjectId, ref: "Startup" },
    nextMatch: { type: Schema.Types.ObjectId, ref: "Match" },
  },
  { timestamps: true }
);

MatchSchema.index({ tournament: 1, round: 1, slot: 1 }, { unique: true });

export const Match: Model<IMatch> = models.Match || model<IMatch>("Match", MatchSchema);
export default Match;
