import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type TournamentStatus =
  | "registration" // 1-hour public entry window open
  | "seeding" // window closed, bracket being generated
  | "in_progress" // knockout rounds running
  | "completed" // champion decided
  | "cancelled"; // e.g. fewer than 2 entrants when window closed

export interface ITournament extends Document {
  _id: Types.ObjectId;
  name: string;
  status: TournamentStatus;
  registrationOpensAt: Date;
  registrationClosesAt: Date; // registrationOpensAt + 1 hour
  maxEntrants: number; // 32
  minEntrants: number; // 2
  bracketSize: number; // power of 2 rounded up from entrant count (includes byes)
  totalRounds: number; // log2(bracketSize)
  currentRound: number; // 0 = not started
  roundDurationMinutes: number; // custom per-round duration, defaults to 1 day
  entrants: Types.ObjectId[]; // Startup refs, in registration order
  champion?: Types.ObjectId; // Startup ref, set on completion
  // Set to 1 while status is registration/seeding/in_progress, unset once
  // completed/cancelled. A partial unique index on this (not on `status`
  // itself — status has multiple "open" values, so a unique index on it alone
  // wouldn't stop e.g. one registration + one in_progress tournament coexisting)
  // is what actually enforces "only one active tournament at a time" atomically.
  activeLock?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["registration", "seeding", "in_progress", "completed", "cancelled"],
      default: "registration",
      index: true,
    },
    registrationOpensAt: { type: Date, required: true },
    registrationClosesAt: { type: Date, required: true },
    maxEntrants: { type: Number, default: 32, max: 32 },
    minEntrants: { type: Number, default: 2, min: 2 },
    bracketSize: { type: Number, default: 0 },
    totalRounds: { type: Number, default: 0 },
    currentRound: { type: Number, default: 0 },
    roundDurationMinutes: { type: Number, required: true, default: 1440 },
    entrants: [{ type: Schema.Types.ObjectId, ref: "Startup" }],
    champion: { type: Schema.Types.ObjectId, ref: "Startup" },
    activeLock: { type: Number },
  },
  { timestamps: true }
);

TournamentSchema.index(
  { activeLock: 1 },
  { unique: true, partialFilterExpression: { activeLock: { $exists: true } } }
);

export const Tournament: Model<ITournament> =
  models.Tournament || model<ITournament>("Tournament", TournamentSchema);
export default Tournament;
