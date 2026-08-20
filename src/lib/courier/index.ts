import type { ICourierService, CourierRateRequest, CourierRateResponse } from "./interface";
import { MockCourierService } from "./mock";
import { TraxService } from "./trax";
import { PostExService } from "./postex";
import { LeopardsService } from "./leopards";

/**
 * CourierManager — Central registry for all courier services.
 * Manages service selection, rate comparison, and graceful fallback.
 */

const SERVICES: Record<string, () => ICourierService> = {
  trax: () => new TraxService(),
  postex: () => new PostExService(),
  leopards: () => new LeopardsService(),
  mock: () => new MockCourierService(),
};

/**
 * Get a specific courier service by name.
 * Falls back to MockCourierService if name not found or not configured.
 */
export function getCourierService(name?: string): ICourierService {
  if (!name) {
    // Auto-detect from env
    const provider = process.env.COURIER_PROVIDER?.toLowerCase();
    if (provider && SERVICES[provider]) return SERVICES[provider]();
    return new MockCourierService();
  }

  const key = name.toLowerCase();
  if (SERVICES[key]) return SERVICES[key]();
  return new MockCourierService();
}

/**
 * Get all configured courier services.
 * Always includes mock for development.
 */
export function getAllCourierServices(): ICourierService[] {
  return [
    new TraxService(),
    new PostExService(),
    new LeopardsService(),
  ];
}

/**
 * Compare rates across all available couriers.
 * Gracefully handles individual courier failures — returns rates for those that succeed.
 */
export async function getAvailableRates(req: CourierRateRequest): Promise<CourierRateResponse[]> {
  const services = getAllCourierServices();

  const results = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const rate = await service.getRates(req);
        return rate;
      } catch (err: any) {
        return {
          success: false,
          courierName: service.name,
          rate: 0,
          estimatedDays: "",
          error: err.message,
        } as CourierRateResponse;
      }
    })
  );

  const rates: CourierRateResponse[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      rates.push(result.value);
    }
  }

  // If no real services returned rates, add mock as fallback
  if (rates.length === 0) {
    const mockService = new MockCourierService();
    const mockRate = await mockService.getRates(req);
    rates.push(mockRate);
  }

  // Sort by rate (cheapest first)
  return rates.sort((a, b) => a.rate - b.rate);
}
