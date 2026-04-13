import { MapPoint } from "../types/decision";

const EARTH_RADIUS_METERS = 6371000;

export function calculateAreaHectares(points: MapPoint[]): number {
  if (points.length < 3) {
    return 0;
  }

  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    const currentLat = toRadians(current.latitude);
    const nextLat = toRadians(next.latitude);
    const currentLon = toRadians(current.longitude);
    const nextLon = toRadians(next.longitude);

    area += (nextLon - currentLon) * (2 + Math.sin(currentLat) + Math.sin(nextLat));
  }

  const squareMeters = Math.abs((area * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2);
  return Number((squareMeters / 10000).toFixed(2));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

