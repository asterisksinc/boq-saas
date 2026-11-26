/** Map geometry helpers for the vendor map (MapLibre GL). */

/** Geodesic circle as a GeoJSON polygon, so the radius ring is true to distance at any zoom. */
export function circlePolygon(c: { lat: number; lng: number }, radiusKm: number, steps = 96): GeoJSON.Feature<GeoJSON.Polygon> {
    const coords: Array<[number, number]> = [];
    const lat = (c.lat * Math.PI) / 180;
    const lng = (c.lng * Math.PI) / 180;
    const d = radiusKm / 6371;
    for (let i = 0; i <= steps; i++) {
        const brg = (i / steps) * 2 * Math.PI;
        const lat2 = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brg));
        const lng2 = lng + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(lat2));
        coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
    }
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

export function boundsOf(points: Array<[number, number]>): [[number, number], [number, number]] {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}
