import { model, Schema, Types } from "mongoose";

export interface IQueueSequence {
  _id: string;
  clinicId: Types.ObjectId;
  localDate: string;
  lastTokenNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IQueueSequence>({
  _id: { type: String, required: true },
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true, immutable: true },
  localDate: { type: String, required: true, immutable: true },
  lastTokenNumber: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true, versionKey: false });

export const QueueSequenceModel = model<IQueueSequence>("QueueSequence", schema);
