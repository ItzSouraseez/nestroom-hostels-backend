/**
 * Haversine formula — calculates great-circle distance between two GPS points.
 * Returns distance in metres.
 */

const EARTH_RADIUS_METRES = 6_371_000;

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate distance between two coordinates using Haversine formula.
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in metres
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METRES * c * 100) / 100; // 2 decimal places
};

/**
 * Determine if a resident's location is within the hostel's geofence.
 * @param {{ latitude: number, longitude: number }} residentCoords
 * @param {{ latitude: number, longitude: number }} hostelCoords
 * @param {number} radiusMetres - Geofence radius in metres
 * @returns {{ isWithin: boolean, distanceMetres: number }}
 */
const checkGeofence = (residentCoords, hostelCoords, radiusMetres = 500) => {
  const distanceMetres = calculateDistance(
    residentCoords.latitude,
    residentCoords.longitude,
    hostelCoords.latitude,
    hostelCoords.longitude
  );

  return {
    isWithin: distanceMetres <= radiusMetres,
    distanceMetres,
  };
};

module.exports = { calculateDistance, checkGeofence };
