import { useState } from 'react';
import { POLISH_CITIES } from '../data/cities';

const FUEL_L_PER_100 = 7;
const FUEL_PRICE_PLN = 6.5;

export function useDistance() {
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);
  const [error,   setError]     = useState(null);
  const [routeGeo, setRouteGeo] = useState(null);

  async function calculate(fromName, toLat, toLng) {
    const city = POLISH_CITIES.find(c => c.name.toLowerCase() === fromName.toLowerCase());
    if (!city) { setError('Nie znaleziono miasta. Spróbuj innej nazwy.'); return; }

    setLoading(true);
    setError(null);
    setResult(null);
    setRouteGeo(null);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${city.lng},${city.lat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok') throw new Error('Nie udało się wyznaczyć trasy');

      const route    = data.routes[0];
      const km       = Math.round(route.distance / 1000);
      const minutes  = Math.round(route.duration / 60);
      const hours    = Math.floor(minutes / 60);
      const mins     = minutes % 60;
      const fuelCost = Math.round((km / 100) * FUEL_L_PER_100 * FUEL_PRICE_PLN);

      setResult({ km, hours, mins, fuelCost, fromName: city.name });
      setRouteGeo(route.geometry);
    } catch (e) {
      setError(e.message || 'Błąd połączenia z serwisem tras.');
    } finally {
      setLoading(false);
    }
  }

  return { calculate, loading, result, error, routeGeo };
}
