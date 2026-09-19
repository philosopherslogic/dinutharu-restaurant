// lib/delivery.ts

export function calculateDeliveryFee(distanceKm: number | null): number {
  if (distanceKm === null || distanceKm <= 0) return 0;
  
  // Under or equal to 500 meters (0.5 km)
  if (distanceKm <= 0.5) {
    return 100;
  }
  
  // Exceeds max delivery radius
  if (distanceKm > 5.0) {
    return 0; // Out of delivery range
  }

  // Smooth linear increment between 0.5km (LKR 100) and 5.0km (LKR 350)
  const minFee = 100;
  const maxFee = 350;
  const minDistance = 0.5;
  const maxDistance = 5.0;

  const interpolatedFee = minFee + ((distanceKm - minDistance) / (maxDistance - minDistance)) * (maxFee - minFee);
  
  // Round to nearest 5 or 10 LKR for clean Sri Lankan Rupee pricing
  return Math.round(interpolatedFee / 5) * 5;
}