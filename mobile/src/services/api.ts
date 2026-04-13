import { DecisionPayload, DecisionResponse } from "../types/decision";
import { APP_CONFIG } from "./config";
import { buildMockDecision } from "./mockDecision";

export async function requestDecision(payload: DecisionPayload): Promise<DecisionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(`${APP_CONFIG.apiBaseUrl}/api/v1/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const json = (await response.json()) as
      | { status: "ok"; data: DecisionResponse }
      | { status: "error"; error: string };

    if (!response.ok || json.status !== "ok") {
      const errorMessage = "error" in json ? json.error : "Failed to get recommendation";
      throw new Error(errorMessage);
    }

    return json.data;
  } catch (error) {
    if (APP_CONFIG.useMockFallback) {
      console.warn("Falling back to mock decision response:", error);
      return buildMockDecision(payload);
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while contacting the RootRise backend.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
