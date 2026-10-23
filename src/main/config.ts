// This file contains configuration that will be bundled with the application
import * as dotenv from 'dotenv'

// Load environment variables in development
dotenv.config()

// These values will be embedded in the build
export const CONFIG = {
  GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),
  WS_URL: (process.env.WS_URL || 'wss://websocket-23q5.onrender.com').trim(),
  LLM_HOST: (process.env.LLM_host || process.env.LLM_HOST || 'http://127.0.0.1:31415').trim(),
  LLM_API_KEY: (process.env.LLM_API_KEY || '').trim()
}
