export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (x: number) => (x * Math.PI) / 180
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}
export const RAIOS = [1, 3, 5, 10, 20, 50]
// Integração futura: endereço -> coordenadas (ex.: Google Geocoding / Nominatim), rodando no servidor.
export async function geocode(_address: string): Promise<{ lat: number; lng: number } | null> { return null }
