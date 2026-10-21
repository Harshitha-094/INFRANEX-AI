/**
 * Bengaluru Administrative Service Boundary & Geospatial Validation Utility
 *
 * Defines the operational boundary for INFRANEX AI civic infrastructure management.
 * All citizen reports, GPS location fixes, map centers, and demonstration incident telemetry
 * are strictly restricted to the Greater Bengaluru (BBMP) metropolitan region.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

// Center of Bengaluru (Vidhana Soudha / MG Road civic core)
export const BENGALURU_CENTER: LatLng = {
  lat: 12.9716,
  lng: 77.5946,
};

export const BENGALURU_DEFAULT_ZOOM = 12;

export const BENGALURU_LOCATION_LABEL = 'Bengaluru, Karnataka';

export const BENGALURU_OUT_OF_BOUNDS_ERROR =
  'INFRANEX AI currently accepts reports only within Bengaluru.';

/**
 * Greater Bengaluru (BBMP) Municipal Service Area Boundary Coordinates [lat, lng].
 * Covers the 8 administrative municipal zones:
 * 1. East Zone (Shivajinagar, Pulakeshinagar, Shantinagar)
 * 2. West Zone (Malleshwaram, Gandhinagar, Rajajinagar)
 * 3. South Zone (Jayanagar, Basavanagudi, Padmanabhanagar, BTM)
 * 4. Mahadevapura Zone (Outer Ring Road, Marathahalli, Whitefield, Bellandur)
 * 5. Bommanahalli Zone (HSR Layout, Silk Board, Begur, Electronic City Corridor)
 * 6. Yelahanka Zone (Yelahanka New Town, Jakkur, Sahakar Nagar, Vidyaranyapura)
 * 7. Dasarahalli Zone (Peenya Industrial Area, Hessarghatta Road, Bagalakunte)
 * 8. Rajarajeshwarinagar Zone (Kengeri, Nayandahalli, Nagarbhavi, RR Nagar)
 *
 * Limitation Notice: This high-fidelity polygon approximates the urban administrative BBMP
 * metropolitan boundary for the prototype. In production, PostGIS ST_Contains against official
 * survey shapefiles will be used.
 */
export const BENGALURU_SERVICE_BOUNDARY_POLYGON: [number, number][] = [
  [13.1500, 77.5750], // North Yelahanka / Chikkajala approach
  [13.1300, 77.6250], // Kogilu / Agrahara Layout
  [13.1050, 77.6750], // Hennur / Kannuru North
  [13.0750, 77.7250], // Horamavu / Chelekere
  [13.0300, 77.7650], // Avalahalli / Old Madras Road East
  [12.9900, 77.7850], // Kadugodi / Whitefield East Outer
  [12.9550, 77.7780], // Varthur / Gunjur Lake Basin
  [12.9150, 77.7450], // Sarjapur Road / Carmelaram
  [12.8550, 77.7000], // Electronic City Phase 2 Outer
  [12.8250, 77.6650], // Electronic City Phase 1 South Border
  [12.8350, 77.6150], // Begur / Hulimavu South
  [12.8550, 77.5700], // Gottigere / Bannerghatta Road Border
  [12.8750, 77.5150], // Konanakunte / Kanakapura Road Border
  [12.8950, 77.4700], // Kengeri / Mysore Road Southwest
  [12.9450, 77.4600], // Nagarbhavi / Ullal West
  [12.9950, 77.4750], // Sunkadakatte / Magadi Road Border
  [13.0450, 77.4950], // Peenya Industrial / Dasarahalli
  [13.0850, 77.5250], // Jalahalli / Hessarghatta Road Border
  [13.1280, 77.5450], // Yelahanka Satellite Town West
];

/**
 * Standard Ray-Casting algorithm for point-in-polygon verification.
 * Returns true if the coordinate point [lat, lng] is strictly within the polygon boundary.
 */
export function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    const intersect =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Validates whether the given latitude & longitude are within the configured Bengaluru service boundary.
 */
export function isPointInBengaluru(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  return isPointInPolygon(lat, lng, BENGALURU_SERVICE_BOUNDARY_POLYGON);
}

/**
 * Bengaluru Ward Directory for demonstration data & report categorization.
 */
export const BENGALURU_WARDS = [
  'Mahadevapura Tech Corridor (Ward 85)',
  'Koramangala & HSR Sector (Ward 151)',
  'Indiranagar & Domlur Central (Ward 74)',
  'Bommanahalli & Electronic City (Ward 174)',
  'Malleshwaram & Rajajinagar (Ward 45)',
  'Yelahanka & Hebbal Transit Zone (Ward 4)',
] as const;
