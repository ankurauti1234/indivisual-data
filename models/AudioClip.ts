import mongoose, { Schema, Document } from "mongoose";

export interface IAudioClip extends Document {
  fileName: string;
  s3Url: string;
  type: "ads" | "songs";
  channel: string;
  region: string;
  date: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedByUsername: string; // Username field
  uploadedAt: Date;
}

const AudioClipSchema: Schema = new Schema({
  fileName: { type: String, required: true },
  s3Url: { type: String, required: true },
  type: { type: String, enum: ["ads", "songs"], required: true },
  channel: { type: String, required: true },
  region: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedByUsername: { type: String, default: "Unknown" }, // Default value for backward compatibility
  uploadedAt: { type: Date, default: Date.now },
});

// Check if model exists before creating to prevent overwrite during hot reloading
export default mongoose.models.AudioClip ||
  mongoose.model<IAudioClip>("AudioClip", AudioClipSchema);
