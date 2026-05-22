import mongoose from 'mongoose';

const inferenceLogSchema = new mongoose.Schema({
  sessionId:        { type: String, required: true, index: true },
  model:            { type: String, required: true },
  provider:         { type: String, required: true },   // groq | gemini
  latencyMs:        { type: Number },
  promptTokens:     { type: Number },
  completionTokens: { type: Number },
  totalTokens:      { type: Number },
  status:           { type: String, enum: ['success', 'error'], default: 'success' },
  error:            { type: String },
  inputPreview:     { type: String },   // first 100 chars of user message
  outputPreview:    { type: String },   // first 100 chars of response
  timestamp:        { type: Date, default: Date.now }
});

export default mongoose.model('InferenceLog', inferenceLogSchema);
