// Type definitions for the chatbot API
declare global {
  interface Window {
    api: {
      chatbot: {
        askMcp: (prompt: any) => Promise<any>;
        setModel: (model: string) => Promise<{ 
          success: boolean; 
          model: string; 
          error?: string 
        }>;
        getModel: () => Promise<{ model: string }>;
      };
      // ... other API interfaces
    };
  }
}

// Gemini model type
export interface GeminiModel {
  id: string;
  name: string;
}

export {};
