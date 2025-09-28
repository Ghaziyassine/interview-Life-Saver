// This file contains configuration that will be bundled with the application
import * as dotenv from 'dotenv'

// Load environment variables in development
dotenv.config()

// These values will be embedded in the build
export const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  WEBHOOK_URL: process.env.WEBHOOK_URL || ''
}
