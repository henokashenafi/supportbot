// Shared TypeScript types used across the application

/** Configuration for a single widget instance */
export interface WidgetConfig {
  id: string;           // UUID
  botName: string;      // e.g. "Acme Support"
  welcomeMessage: string;
  brandColor: string;   // Hex color, e.g. "#6366f1"
  knowledgeBase: string; // Plain text pasted by the business owner
  createdAt: string;    // ISO date string
  updatedAt: string;
}

/** What the public /api/widget/[id] endpoint exposes (no knowledge base) */
export interface PublicWidgetConfig {
  id: string;
  botName: string;
  welcomeMessage: string;
  brandColor: string;
}

/** A single message in a chat conversation */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Request body sent to /api/chat */
export interface ChatRequest {
  widgetId: string;
  message: string;
  history: ChatMessage[];
}

/** Response from /api/chat */
export interface ChatResponse {
  reply: string;
}
