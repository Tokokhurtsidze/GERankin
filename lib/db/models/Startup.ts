import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import type { LocalizedText } from "@/lib/i18n/localized";

export interface IStartup extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId; // 1 user = 1 startup, enforced via unique index
  tournament: Types.ObjectId; // which tournament cycle this entry belongs to
  name: string;
  tagline: LocalizedText;
  description: LocalizedText;
  logoUrl: string;
  websiteUrl: string;
  pitchDeckUrl?: string;
  seed?: number; // assigned at bracket generation time
  eliminated: boolean;
  eliminatedRound?: number;
  totalVotesReceived: number;
  createdAt: Date;
  updatedAt: Date;
}

const StartupSchema = new Schema<IStartup>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tournament: { type: Schema.Types.ObjectId, ref: "Tournament", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    tagline: {
      en: { type: String, required: true, trim: true, maxlength: 160 },
      ka: { type: String, required: true, trim: true, maxlength: 160 },
    },
    description: {
      en: { type: String, required: true, maxlength: 2000 },
      ka: { type: String, required: true, maxlength: 2000 },
    },
    logoUrl: { type: String, required: true },
    websiteUrl: { type: String, required: true },
    pitchDeckUrl: { type: String },
    seed: { type: Number, min: 1, max: 32 },
    eliminated: { type: Boolean, default: false },
    eliminatedRound: { type: Number },
    totalVotesReceived: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Enforces "1 user = 1 startup" PER tournament cycle.
StartupSchema.index({ owner: 1, tournament: 1 }, { unique: true });

export const Startup: Model<IStartup> = models.Startup || model<IStartup>("Startup", StartupSchema);
export default Startup;
