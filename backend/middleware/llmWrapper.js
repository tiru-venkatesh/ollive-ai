import dotenv from 'dotenv';
dotenv.config();
import Groq from 'groq-sdk';
import InferenceLog from '../models/InferenceLog.js';
import { redactPII } from '../utils/piiRedactor.js';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROVIDERS = {
  groq:   { name: 'groq',   model: 'llama-3.1-8b-instant' },
};      
// Standard (non-streaming) LLM call
export async function callLLM({ messages, sessionId, provider = 'groq' }) {
  const config = PROVIDERS[provider] || PROVIDERS.groq;
  const start = Date.now();

  let response = null;
  let tokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let status = 'success';
  let errorMsg = null;

  const rawInput = messages[messages.length - 1]?.content?.slice(0, 100);

  try {
    if (provider === 'groq') {
      const result = await groq.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: 1024,
      });
      response = result.choices[0].message.content;
      tokenUsage = {
        prompt_tokens: result.usage?.prompt_tokens || 0,
        completion_tokens: result.usage?.completion_tokens || 0,
        total_tokens: result.usage?.total_tokens || 0,
      };
    } else if (provider === 'gemini') {
      const model = genAI.getGenerativeModel({ model: config.model });
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(messages[messages.length - 1].content);
      response = result.response.text();
    }
  } catch (err) {
    status = 'error';
    errorMsg = err.message;
  }

  const latencyMs = Date.now() - start;

  // PII redaction applied before storing previews
  InferenceLog.create({
    sessionId,
    model: config.model,
    provider: config.name,
    latencyMs,
    promptTokens: tokenUsage.prompt_tokens,
    completionTokens: tokenUsage.completion_tokens,
    totalTokens: tokenUsage.total_tokens,
    status,
    error: errorMsg,
    inputPreview:  redactPII(rawInput),
    outputPreview: redactPII(response?.slice(0, 100)),
  }).catch(console.error);

  if (status === 'error') throw new Error(errorMsg);
  return response;
}

// Streaming LLM call (Groq only) — yields chunks via async generator
export async function* streamLLM({ messages, sessionId }) {
  const config = PROVIDERS.groq;
  const start = Date.now();
  let fullResponse = '';

  const stream = await groq.chat.completions.create({
    model: config.model,
    messages,
    stream: true,
    max_tokens: 1024,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullResponse += delta;
      yield delta;
    }
  }

  const latencyMs = Date.now() - start;
  const rawInput = messages[messages.length - 1]?.content?.slice(0, 100);

  // Log after stream completes
  InferenceLog.create({
    sessionId,
    model: config.model,
    provider: config.name,
    latencyMs,
    status: 'success',
    inputPreview:  redactPII(rawInput),
    outputPreview: redactPII(fullResponse.slice(0, 100)),
  }).catch(console.error);

  return fullResponse;
}