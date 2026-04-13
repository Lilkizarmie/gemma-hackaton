import { Request, Response } from "express";
import { generateDecision } from "../services/decision.service";
import { validateDecisionRequest } from "../utils/validation";

export async function postDecision(req: Request, res: Response): Promise<void> {
  const requestId = createRequestId();

  try {
    const input = validateDecisionRequest(req.body);
    logIncomingDecision(requestId, input);
    const result = await generateDecision(input);
    logDecisionResult(requestId, result);

    res.status(200).json({
      status: "ok",
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = isValidationError(message) ? 400 : 500;
    logDecisionError(requestId, message, statusCode);

    res.status(statusCode).json({
      status: "error",
      error: message
    });
  }
}

function isValidationError(message: string): boolean {
  return [
    "Request body must be a valid object",
    "Field boundary coordinates are required",
    "Location state is required",
    "Location country is required",
    "Goal must be one of: profit, food_security, low_effort",
    "Budget cannot be negative",
    "Field boundary must contain at least 3 points and be closed",
    "Field area must be greater than zero"
  ].includes(message) || message.startsWith("No suitable crops found");
}

function createRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function logIncomingDecision(requestId: string, input: ReturnType<typeof validateDecisionRequest>): void {
  const pointCount = input.field.boundary.coordinates[0]?.length ?? 0;

  console.log(`[decision:${requestId}] request`);
  console.log(
    JSON.stringify(
      {
        fieldName: input.field.name ?? "Unnamed field",
        state: input.location.state,
        country: input.location.country,
        goal: input.goal,
        season: input.season ?? "rainy",
        budget: input.budget ?? null,
        providedLandSize: input.land?.size ?? null,
        polygonPointCount: pointCount
      },
      null,
      2
    )
  );
}

function logDecisionResult(requestId: string, result: Awaited<ReturnType<typeof generateDecision>>): void {
  console.log(`[decision:${requestId}] response`);
  console.log(
    JSON.stringify(
      {
        recommendedCrop: result.recommendedCrop,
        calculations: result.calculations,
        explanation: result.explanation,
        rankedOptions: result.rankedOptions,
        meta: result.meta
      },
      null,
      2
    )
  );
}

function logDecisionError(requestId: string, message: string, statusCode: number): void {
  console.error(`[decision:${requestId}] error ${statusCode}: ${message}`);
}
