import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { COIN_PACKS, SUBSCRIPTION_PLANS, COUNTRY_PRICING_MAP } from '../constants';

// Reverse geocode lat/lng → ISO country code using a free API
async function getCountryFromCoords(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'ConnectNow/1.0' } }
    );
    const data = await res.json();
    return data?.address?.country_code?.toUpperCase() || null;
  } catch {
    return null;
  }
}

/**
 * useRegionalPricing
 * - Requests GPS permission once
 * - Maps device location → ISO country code
 * - Returns correct coin packs + VIP plans for that country
 * - Anti-abuse: pricing region comes from GPS, NOT user preference
 */
export function useRegionalPricing() {
  const [pricingRegion, setPricingRegion] = useState('default');
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationLoading(false);
          return; // keep 'default' (USD pricing)
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest, // fast, low battery
        });

        const countryCode = await getCountryFromCoords(
          loc.coords.latitude,
          loc.coords.longitude
        );

        if (!cancelled && countryCode) {
          setDetectedCountry(countryCode);
          const region = COUNTRY_PRICING_MAP[countryCode] || 'default';
          setPricingRegion(region);
        }
      } catch {
        // Permission denied or location unavailable → default pricing
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const coinPacks = COIN_PACKS[pricingRegion] || COIN_PACKS.default;
  const subPlans  = SUBSCRIPTION_PLANS[pricingRegion] || SUBSCRIPTION_PLANS.default;

  return {
    coinPacks,
    subPlans,
    pricingRegion,
    detectedCountry,
    locationLoading,
    currency: coinPacks[0]?.currency || '$',
  };
}
