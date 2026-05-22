const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * OlliveSDK - Lightweight client wrapper for LLM inference
 * Captures latency, status, and session metadata on every call
 */
export class OlliveSDK {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || BASE_URL;
    this.provider = options.provider || 'groq';
  }

  async sendMessage({ message, sessionId }) {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, provider: this.provider }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      return {
        ...data,
        latency: Date.now() - start,
        status: 'success',
      };
    } catch (err) {
      return {
        error: err.message,
        latency: Date.now() - start,
        status: 'error',
      };
    }
  }

  async getLogs() {
    const res = await fetch(`${this.baseUrl}/api/logs`);
    return res.json();
  }

  async getStats() {
    const res = await fetch(`${this.baseUrl}/api/logs/stats`);
    return res.json();
  }

  async getConversations() {
    const res = await fetch(`${this.baseUrl}/api/conversations`);
    return res.json();
  }

  async getConversation(sessionId) {
    const res = await fetch(`${this.baseUrl}/api/conversations/${sessionId}`);
    return res.json();
  }

  async deleteConversation(sessionId) {
    const res = await fetch(`${this.baseUrl}/api/conversations/${sessionId}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  setProvider(provider) {
    this.provider = provider;
    return this;
  }
}

export const sdk = new OlliveSDK();
