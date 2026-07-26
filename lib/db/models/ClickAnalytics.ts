import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IClickAnalytics extends Document {
  _id: Types.ObjectId;
  startup: Types.ObjectId;
  tournament: Types.ObjectId;
  source: "card" | "showcase" | "slides" | "leaderboard"; // where the click originated
  referrer?: string;
  ip: string;
  userAgent?: string;
  createdAt: Date;
}

const ClickAnalyticsSchema = new Schema<IClickAnalytics>(
  {
    startup: { type: Schema.Types.ObjectId, ref: "Startup", required: true, index: true },
    tournament: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    source: {
      type: String,
      enum: ["card", "showcase", "slides", "leaderboard"],
      required: true,
    },
    referrer: { type: String },
    ip: { type: String, required: true },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ClickAnalyticsSchema.index({ startup: 1, createdAt: -1 });

export const ClickAnalytics: Model<IClickAnalytics> =
  models.ClickAnalytics || model<IClickAnalytics>("ClickAnalytics", ClickAnalyticsSchema);
export default ClickAnalytics;
