import type {
  ICourierService, CourierShipmentRequest, CourierShipmentResponse,
  CourierTrackingResponse, CourierRateRequest, CourierRateResponse,
} from "./interface";

/**
 * Mock courier — used in development / when no real courier is configured.
 * Returns realistic fake responses so the full order flow can be tested.
 */
export class MockCourierService implements ICourierService {
  name = "Mock Courier";

  async bookShipment(req: CourierShipmentRequest): Promise<CourierShipmentResponse> {
    const trackingId = `PD-TRK-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      shipmentId: `SHIP-${req.orderId}`,
      trackingId,
      awbNumber: `AWB-${Date.now().toString(36).toUpperCase()}`,
      trackingUrl: `https://tracking.pakdropship.pk/${trackingId}`,
      rawResponse: { mock: true, orderId: req.orderId },
    };
  }

  async trackShipment(trackingId: string): Promise<CourierTrackingResponse> {
    return {
      success: true,
      currentStatus: "InTransit",
      events: [
        { timestamp: new Date().toISOString(), status: "Booked", location: "Lahore Hub", description: "Shipment booked" },
        { timestamp: new Date().toISOString(), status: "InTransit", location: "Karachi Hub", description: "In transit" },
      ],
    };
  }

  async cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async getRates(req: CourierRateRequest): Promise<CourierRateResponse> {
    // Mock rate calculation based on weight and fragile status
    const baseRate = 200;
    const weightSurcharge = Math.ceil((req.weight || 500) / 1000) * 50;
    const fragileSurcharge = req.isFragile ? 50 : 0;
    const rate = baseRate + weightSurcharge + fragileSurcharge;

    return {
      success: true,
      courierName: this.name,
      rate,
      estimatedDays: "2-4 days",
      serviceType: "standard",
    };
  }
}
