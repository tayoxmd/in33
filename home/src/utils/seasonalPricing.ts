import { supabase } from "@/integrations/supabase/client";

/**
 * Calculate the average price per night including seasonal pricing
 * @param hotelId - The hotel ID
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @param basePrice - Base price per night
 * @returns Average price per night
 */
export async function calculateSeasonalPrice(
  hotelId: string,
  checkIn: Date,
  checkOut: Date,
  basePrice: number
): Promise<number> {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  if (nights <= 0) return basePrice;

  // Fetch all seasonal pricing for this hotel
  const { data: seasonalPricing, error } = await supabase
    .from('hotel_seasonal_pricing')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_available', true);

  if (error || !seasonalPricing || seasonalPricing.length === 0) {
    return basePrice;
  }

  let totalPrice = 0;
  const currentDate = new Date(checkIn);

  // Calculate total price by summing each night's price
  for (let i = 0; i < nights; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Find seasonal price for this date
    const seasonalPrice = seasonalPricing.find(sp => {
      const startDate = new Date(sp.start_date);
      const endDate = new Date(sp.end_date);
      const current = new Date(dateStr);
      return current >= startDate && current <= endDate;
    });

    // Add either seasonal price or base price for each night
    totalPrice += seasonalPrice ? seasonalPrice.price_per_night : basePrice;
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Return average price per night
  // Formula: Sum of all nights' prices / number of nights
  return totalPrice / nights;
}
