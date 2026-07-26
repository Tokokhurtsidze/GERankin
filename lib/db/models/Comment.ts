import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IComment extends Document {
  _id: Types.ObjectId;
  match: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  parent?: Types.ObjectId; // for threaded replies, null = top-level
  edited: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    match: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ match: 1, createdAt: -1 });

export const Comment: Model<IComment> = models.Comment || model<IComment>("Comment", CommentSchema);
export default Comment;
