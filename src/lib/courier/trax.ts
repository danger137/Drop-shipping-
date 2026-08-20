import type {
  ICourierService, CourierShipmentRequest, CourierShipmentResponse,
  CourierTrackingResponse, CourierRateRequest, CourierRateResponse,
} from "./interface";

/**
 * Trax courier integration.
 * Docs: https://api.trax.pk/
 * 
 * Set env vars:
 *   TRAX_API_KEY
 *   TRAX_API_URL (default: https://api.trax.pk/api)
 */
export class TraxService implements ICourierService {
  name = "Trax";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TRAX_API_KEY || "";
    this.baseUrl = process.env.TRAX_API_URL || "https://api.trax.pk/api";
  }

  private get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private get headers() {
    return {
      "Content-Type": "application/json",
      "Authorization": this.apiKey,
    };
  }

  async bookShipment(req: CourierShipmentRequest): Promise<CourierShipmentResponse> {
    if (!this.isConfigured) {
      return { success: false, error: "Trax API key not configured" };
    }

    try {
      const payload = {
        service_type_id: 1, // Regular COD
        pickup_address_id: null, // Will use dynamic pickup
        information_display: 0,
        consignee_city_id: null,
        consignee_name: req.customerName,
        consignee_address: req.address,
        consignee_phone_number_1: req.phone,
        consignee_email_address: "",
        order_id: req.orderId,
        item_product_type_id: 1,
        item_description: req.description || "Product",
        item_quantity: 1,
        item_insurance: 0,
        pickup_address: req.pickupAddress || "",
        pickup_city: req.pickupCity || "",
        pickup_phone: req.pickupPhone || "",
        item_price: req.codAmount,
        pick_up_instruction_notes: `PakDropship Order ${req.orderId}`,
        special_instructions: `Weight: ${req.weight || 500}g`,
        charges: req.codAmount,
      };

      const res = await fetch(`${this.baseUrl}/shipment/book`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === 1 || data.status === true) {
        return {
          success: true,
          shipmentId: data.tracking_number || data.shipment_id,
          trackingId: data.tracking_number,
          awbNumber: data.tracking_number,
          trackingUrl: `https://trax.pk/tracking/${data.tracking_number}`,
          rawResponse: data,
        };
      }

      return { success: false, error: data.message || "Trax booking failed", rawResponse: data };
    } catch (err: any) {
      return { success: false, error: `Trax API error: ${err.message}` };
    }
  }

  async trackShipment(trackingId: string): Promise<CourierTrackingResponse> {
    if (!this.isConfigured) {
      return { success: false, error: "Trax API key not configured" };
    }

    try {
      const res = await fetch(`${this.baseUrl}/shipment/track?tracking_number=${trackingId}`, {
        headers: this.headers,
      });
      const data = await res.json();

      if (data.status === 1) {
        const events = (data.tracking_history || []).map((e: any) => ({
          timestamp: e.date_time || e.created_at,
          status: e.status || e.type,
          location: e.city || "",
          description: e.status_reason || e.type || "",
        }));

        return {
          success: true,
          currentStatus: data.delivery_status || events[events.length - 1]?.status || "Unknown",
          events,
        };
      }

      return { success: false, error: data.message || "Tracking failed" };
    } catch (err: any) {
      return { success: false, error: `Trax tracking error: ${err.message}` };
    }
  }

  async cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: "Trax API key not configured" };
    }

    try {
      const res = await fetch(`${this.baseUrl}/shipment/cancel`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ tracking_number: shipmentId }),
      });
      const data = await res.json();
      return { success: data.status === 1 || data.status === true, error: data.message };
    } catch (err: any) {
      return { success: false, error: `Trax cancel error: ${err.message}` };
    }
  }

  async getRates(req: CourierRateRequest): Promise<CourierRateResponse> {
    if (!this.isConfigured) {
      // Return estimated rate when API key not available
      const baseRate = 200;
      const weightCharge = Math.ceil((req.weight || 500) / 1000) * 40;
      return {
        success: true,
        courierName: this.name,
        rate: baseRate + weightCharge,
        estimatedDays: "2-3 days",
        serviceType: "standard",
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/charges/calculate`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          service_type_id: 1,
          origin_city: req.pickupCity,
          destination_city: req.destinationCity,
          est_weight: Math.ceil((req.weight || 500) / 1000),
          item_price: req.codAmount,
        }),
      });
      const data = await res.json();

      if (data.status === 1) {
        return {
          success: true,
          courierName: this.name,
          rate: data.charges || data.total_charges || 250,
          estimatedDays: data.estimated_days || "2-3 days",
          serviceType: "standard",
        };
      }

      // Fallback rate
      return {
        success: true,
        courierName: this.name,
        rate: 250,
        estimatedDays: "2-3 days",
        serviceType: "standard",
      };
    } catch {
      return {
        success: true,
        courierName: this.name,
        rate: 250,
        estimatedDays: "2-3 days",
        serviceType: "standard",
      };
    }
  }
}
