import { Goal, MapPoint, Season } from "./decision";

export type Step = "field" | "goal" | "result";

export interface FieldSetupData {
  fieldName: string;
  state: string;
  country: string;
  season: Season;
  points: MapPoint[];
  areaHectares: number;
}

export interface GoalSelectionData {
  goal: Goal;
  budget: string;
}

