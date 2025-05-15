import mongoose, { Schema } from "mongoose";

const RadioDataSchema = new Schema({
  program: { type: String, required: true },
  channel: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  type: { type: String, required: true },
  audio: { type: String, required: true },
  region: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.RadioData ||
  mongoose.model("RadioData", RadioDataSchema);
