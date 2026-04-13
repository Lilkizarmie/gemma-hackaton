import { FieldSetupData, GoalSelectionData } from "../types/app";
import { DecisionPayload } from "../types/decision";

export function createDecisionPayload(
  fieldData: FieldSetupData,
  goalData: GoalSelectionData
): DecisionPayload {
  const coordinates = fieldData.points.map((point) => [point.longitude, point.latitude]);

  if (coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push(first);
    }
  }

  return {
    field: {
      name: fieldData.fieldName,
      boundary: {
        type: "Polygon",
        coordinates: [coordinates]
      }
    },
    location: {
      state: fieldData.state,
      country: fieldData.country
    },
    land: {
      size: fieldData.areaHectares,
      unit: "hectare"
    },
    goal: goalData.goal,
    season: fieldData.season,
    budget: goalData.budget ? Number(goalData.budget) : undefined
  };
}

