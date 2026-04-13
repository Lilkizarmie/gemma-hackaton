export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  stream: boolean;
  format?: "json";
  messages: OllamaChatMessage[];
  options?: {
    temperature?: number;
  };
}

export interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };
}

