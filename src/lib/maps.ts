import type { ListingCoordinates } from "../types/domain";

export const DEFAULT_LISTING_COORDINATES: ListingCoordinates = {
  latitude: -15.4167,
  longitude: 28.2833,
};

export function buildOpenStreetMapUrl(coordinates: ListingCoordinates) {
  const latitude = coordinates.latitude.toFixed(6);
  const longitude = coordinates.longitude.toFixed(6);

  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
}

export function formatCoordinates(coordinates: ListingCoordinates) {
  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
}

export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidCoordinates(
  coordinates: ListingCoordinates | null
): coordinates is ListingCoordinates {
  if (!coordinates) {
    return false;
  }

  return (
    isValidLatitude(coordinates.latitude) && isValidLongitude(coordinates.longitude)
  );
}
