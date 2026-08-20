import type {
  ICourierService, CourierShipmentRequest, CourierShipmentResponse,
  CourierTrackingResponse, CourierRateRequest, CourierRateResponse,
} from "./interface";

/**
 * Leopards Courier integration.
 * Docs: https://leopardscod.com/
 *
 * Set env vars:
 *   LEOPARDS_API_KEY
 *   LEOPARDS_API_PASSWORD
 *   LEOPARDS_API_URL (default: https://merchantapi.leopardscourier.com/api)
 */
export class LeopardsService implements ICourierService {
  name = "Leopards";
  private apiKey: string;
  private apiPassword: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.LEOPARDS_API_KEY || "";
    this.apiPassword = process.env.LEOPARDS_API_PASSWORD || "";
    this.baseUrl = process.env.LEOPARDS_API_URL || "https://merchantapi.leopardscourier.com/api";
  }

  private get isConfigured(): boolean {
    return !!(this.apiKey && this.apiPassword);
  }

  private get headers() {
    return { "Content-Type": "application/json" };
  }

  async bookShipment(req: CourierShipmentRequest): Promise<CourierShipmentResponse> {
    if (!this.isConfigured) {
      return { success: false, error: "Leopards API credentials not configured" };
    }

    try {
      const payload = {
        api_key: this.apiKey,
        api_password: this.apiPassword,
        booked_packet_weight: Math.ceil((req.weight || 500) / 1000),
        booked_packet_vol_weight_w: 0,
        booked_packet_vol_weight_h: 0,
        booked_packet_vol_weight_l: 0,
        booked_packet_no_piece: 1,
        booked_packet_collect_amount: req.codAmount,
        booked_packet_order_id: req.orderId,
        origin_city: req.pickupCity || "",
        destination_city: req.city,
        shipment_name_eng: req.customerName,
        shipment_email: "",
        shipment_phone: req.phone,
        shipment_address: req.address,
        booking_instructions: req.description || "Product",
        shipment_type: "overnight",
        pickup_address: req.pickupAddress || "",
        pickup_phone: req.pickupPhone || "",
      };

      const res = await fetch(`${this.baseUrl}/bookPacket/format/json`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === 1) {
        const trackingNumber = data.packet_list?.[0]?.track_number || data.track_number;
        return {
          success: true,
          shipmentId: trackingNumber,
          trackingId: trackingNumber,
          awbNumber: trackingNumber,
          trackingUrl: `https://leopardscourier.com/tracking/${trackingNumber}`,
          rawResponse: data,
        };
      }

      return { success: false, error: data.error || "Leopards booking failed", rawResponse: data };
    } catch (err: any) {
      return { success: false, error: `Leopards API error: ${err.message}` };
    }
  }

  async trackShipment(trackingId: string): Promise<CourierTrackingResponse> {
    if (!this.isConfigured) {
      return { success: false, error: "Leopards API credentials not configured" };
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/trackBookedPacket/format/json?api_key=${this.apiKey}&api_password=${this.apiPassword}&track_numbers=${trackingId}`,
        { headers: this.headers }
      );
      const data = await res.json();

      if (data.status === 1) {
        const packet = data.packet_list?.[0];
        const history = packet?.activity || [];
        const events = history.map((e: any) => ({
          timestamp: e.date_time || e.activity_date || "",
          status: e.status || e.activity || "",
          location: e.city || "",
          description: e.activity || e.status || "",
        }));

        return {
          success: true,
          currentStatus: packet?.booked_packet_status || "Unknown",
          events,
        };
      }

      return { success: false, error: data.error || "Tracking failed" };
    } catch (err: any) {
      return { success: false, error: `Leopards tracking error: ${err.message}` };
    }
  }

  async cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: "Leopards API credentials not configured" };
    }

    try {
      const res = await fetch(`${this.baseUrl}/cancelBookedPacket/format/json`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          api_key: this.apiKey,
          api_password: this.apiPassword,
          cn_numbers: shipmentId,
        }),
      });
      const data = await res.json();
      return { success: data.status === 1, error: data.error };
    } catch (err: any) {
      return { success: false, error: `Leopards cancel error: ${err.message}` };
    }
  }

  async getRates(req: CourierRateRequest): Promise<CourierRateResponse> {
    if (!this.isConfigured) {
      const baseRate = 190;
      const weightCharge = Math.ceil((req.weight || 500) / 1000) * 35;
      return {
        success: true,
        courierName: this.name,
        rate: baseRate + weightCharge,
        estimatedDays: "2-4 days",
        serviceType: "overnight",
      };
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/getTariff/format/json?api_key=${this.apiKey}&api_password=${this.apiPassword}` +
        `&origin_city=${encodeURIComponent(req.pickupCity)}` +
        `&destination_city=${encodeURIComponent(req.destinationCity)}` +
        `&weight=${Math.ceil((req.weight || 500) / 1000)}`,
        { headers: this.headers }
      );
      const data = await res.json();

      if (data.status === 1) {
        return {
          success: true,
          courierName: this.name,
          rate: data.rate || data.tariff || 230,
          estimatedDays: "2-4 days",
          serviceType: "overnight",
        };
      }

      return {
        success: true,
        courierName: this.name,
        rate: 230,
        estimatedDays: "2-4 days",
        serviceType: "overnight",
      };
    } catch {
      return {
        success: true,
        courierName: this.name,
        rate: 230,
        estimatedDays: "2-4 days",
        serviceType: "overnight",
      };
    }
  }
}
