import { PolygonBoundary } from "../types/decision";

const EARTH_RADIUS_METERS = 6371000;

export function calculatePolygonAreaSquareMeters(boundary: PolygonBoundary): number {
  const ring = boundary.coordinates?.[0];

  if (!ring || ring.length < 4) {
    throw new Error("Field boundary must contain at least 3 points and be closed");
  }

  let area = 0;

  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];

    const currentLon = toRadians(current[0]);
    const currentLat = toRadians(current[1]);
    const nextLon = toRadians(next[0]);
    const nextLat = toRadians(next[1]);

    area += (nextLon - currentLon) * (2 + Math.sin(currentLat) + Math.sin(nextLat));
  }

  return Math.abs((area * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2);
}

export function squareMetersToHectares(areaSquareMeters: number): number {
  return areaSquareMeters / 10000;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

