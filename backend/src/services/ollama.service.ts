import { OllamaChatRequest, OllamaChatResponse } from "../types/ai";
import { ExplanationResult } from "../types/decision";

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "gemma3:1b";

export async function generateWithOllama(prompt: string): Promise<Partial<ExplanationResult>> {
  const requestBody: OllamaChatRequest = {
    model: process.env.OLLAMA_MODEL ?? DEFAULT_MODEL,
    stream: false,
    format: "json",
    messages: [
      {
        role: "system",
        content:
          "You are RootRise AI. Return strictly valid JSON with keys: reasonSummary, farmerAdvice, actionPlan. farmerAdvice must be an array of exactly 3 short strings. actionPlan must be an array of 4 to 6 short strings. Do not invent numbers."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    options: {
      temperature: 0.2
    }
  };

  const response = await fetch(`${process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const json = (await response.json()) as OllamaChatResponse;
  const content = json.message?.content;

  if (!content) {
    throw new Error("Ollama returned an empty response");
  }

  if (process.env.DEBUG_OLLAMA === "true") {
    console.log("RAW_OLLAMA_CONTENT_START");
    console.log(content);
    console.log("RAW_OLLAMA_CONTENT_END");
  }

  const parsed = parseExplanationPayload(content);

  if (
    typeof parsed.reasonSummary !== "string" &&
    !Array.isArray(parsed.farmerAdvice) &&
    !Array.isArray(parsed.actionPlan)
  ) {
    throw new Error(
      `Ollama returned an invalid explanation payload after parsing: ${JSON.stringify(parsed).slice(0, 500)}`
    );
  }

  return {
    reasonSummary: typeof parsed.reasonSummary === "string" ? parsed.reasonSummary : undefined,
    farmerAdvice: Array.isArray(parsed.farmerAdvice)
      ? parsed.farmerAdvice.map((item) => String(item)).slice(0, 3)
      : undefined,
    actionPlan: Array.isArray(parsed.actionPlan)
      ? parsed.actionPlan.map((item) => String(item)).slice(0, 6)
      : undefined
  };
}

function parseExplanationPayload(content: string): Partial<ExplanationResult> {
  const candidates = [
    content,
    extractJsonBlock(content),
    stripMarkdownCodeFence(content)
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as Partial<ExplanationResult>;
    } catch {
      // Keep trying fallbacks.
    }
  }

  const repaired = tryRepairStructuredText(content);
  if (repaired) {
    return repaired;
  }

  const extracted = extractFieldsFromMalformedJson(content);
  if (extracted) {
    return extracted;
  }

  throw new Error(`Ollama returned an invalid explanation payload: ${content.slice(0, 400)}`);
}

function extractJsonBlock(content: string): string | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return content.slice(start, end + 1);
}

function stripMarkdownCodeFence(content: string): string | null {
  const trimmed = content.trim();

  if (!trimmed.startsWith("```")) {
    return null;
  }

  return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
}

function tryRepairStructuredText(content: string): Partial<ExplanationResult> | null {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const reasonSummaryLine =
    lines.find((line) => /^reasonsummary[:\s]/i.test(line)) ??
    lines.find((line) => /^reason[:\s]/i.test(line)) ??
    lines[0];

  const farmerAdvice = collectListItems(lines, ["farmerAdvice", "advice"]);
  const actionPlan = collectListItems(lines, ["actionPlan", "steps", "plan"]);

  if (!reasonSummaryLine || farmerAdvice.length === 0 || actionPlan.length === 0) {
    return null;
  }

  return {
    reasonSummary: reasonSummaryLine.replace(/^[A-Za-z\s]+:\s*/, "").trim(),
    farmerAdvice,
    actionPlan
  };
}

function extractFieldsFromMalformedJson(content: string): Partial<ExplanationResult> | null {
  const reasonSummary =
    extractQuotedValue(content, "reasonSummary") ??
    extractQuotedValue(content, "reason_summary");
  const farmerAdvice =
    extractStringArray(content, "farmerAdvice") ??
    extractStringArray(content, "farmer_advice");
  const actionPlan =
    extractStringArray(content, "actionPlan") ??
    extractStringArray(content, "action_plan");

  if (!reasonSummary || !farmerAdvice?.length || !actionPlan?.length) {
    return null;
  }

  return {
    reasonSummary,
    farmerAdvice,
    actionPlan
  };
}

function extractQuotedValue(content: string, fieldName: string): string | null {
  const patterns = [
    new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, "i"),
    new RegExp(`${fieldName}\\s*:\\s*"([^"]+)"`, "i")
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function extractStringArray(content: string, fieldName: string): string[] | null {
  const patterns = [
    new RegExp(`"${fieldName}"\\s*:\\s*\\[(.*?)\\]`, "is"),
    new RegExp(`${fieldName}\\s*:\\s*\\[(.*?)\\]`, "is")
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const quotedItems = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1].trim());
    if (quotedItems.length > 0) {
      return quotedItems;
    }

    const lineItems = match[1]
      .split(",")
      .map((item) => item.replace(/[\n\r"]/g, "").trim())
      .filter(Boolean);

    if (lineItems.length > 0) {
      return lineItems;
    }
  }

  return null;
}

function collectListItems(lines: string[], sectionNames: string[]): string[] {
  const items: string[] = [];
  let active = false;

  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/\s/g, "");

    if (sectionNames.some((name) => normalized.startsWith(`${name.toLowerCase()}:`))) {
      active = true;
      continue;
    }

    if (/^[a-zA-Z]+:\s*/.test(line) && !line.startsWith("-") && !/^\d+\./.test(line)) {
      active = false;
    }

    if (!active) {
      continue;
    }

    if (line.startsWith("-")) {
      items.push(line.replace(/^-+\s*/, "").trim());
      continue;
    }

    if (/^\d+\./.test(line)) {
      items.push(line.replace(/^\d+\.\s*/, "").trim());
    }
  }

  return items;
}
