import type {
  ICourierService, CourierShipmentRequest, CourierShipmentResponse,
  CourierTrackingResponse, CourierRateRequest, CourierRateResponse,
} from "./interface";

/**
 * PostEx courier integration.
 * Docs: https://api.postex.pk/
 *
 * Set env vars:
 *   POSTEX_API_TOKEN
 *   POSTEX_API_URL (default: https://api.postex.pk)
 */
export class PostExService implements ICourierService {
  name = "PostEx";
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    this.apiToken = process.env.POSTEX_API_TOKEN || "";
    this.baseUrl = process.env.POSTEX_API_URL || "https://api.postex.pk";
  }

  private get isConfigured(): boolean {
    return !!this.apiToken;
  }

  private get headers() {
    return {
      "Content-Type": "application/json",
      "token": this.apiToken,
    };
  }

  async bookShipment(req: CourierShipmentRequest): Promise<CourierShipmentResponse> {
    if (!this.isConfigured) {
      return { success: false, error: "PostEx API token not configured" };
    }

    try {
      const payload = {
        cityName: req.city,
        customerName: req.customerName,
        customerPhone: req.phone,
        deliveryAddress: req.address,
        invoiceDivision: 0,
        invoicePayment: req.codAmount,
        items: 1,
        orderDetail: req.description || "Product",
        orderRefNumber: req.orderId,
        orderType: "Normal",
        pickupAddressCode: "", // Set via PostEx dashboard or use dynamic
        storeAddressCode: "",
        transactionNotes: `PakDropship Order ${req.orderId}`,
        pickupAddress: req.pickupAddress || "",
        pickupPhone: req.pickupPhone || "",
      };

      const res = await fetch(`${this.baseUrl}/services/integration/api/order/v3/create-order`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.statusCode === 200) {
        const trackingNumber = data.dist?.trackingNumber || data.trackingNumber;
        return {
          success: true,
          shipmentId: trackingNumber,
          trackingId: trackingNumber,
          awbNumber: trackingNumber,
          trackingUrl: `https://postex.pk/tracking/${trackingNumber}`,
          rawResponse: data,
        };
      }

      return { success: false, error: data.message || "PostEx booking failed", rawResponse: data };
    } catch (err: any) {
      return { success: false, error: `PostEx API error: ${err.message}` };
    }
  }

  async trackShipment(trackingId: string): Promise<CourierTrackingResponse> {
    if (!this.isConfigured) {
      return { success: false, error: "PostEx API token not configured" };
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/services/integration/api/order/v3/track-order/${trackingId}`,
        { headers: this.headers }
      );
      const data = await res.json();

      if (data.statusCode === 200) {
        const history = data.dist?.transactionStatusHistory || [];
        const events = history.map((e: any) => ({
          timestamp: e.statusDateTime || e.createdAt || "",
          status: e.transactionStatus || "",
          location: e.detail || "",
          description: e.reason || e.transactionStatus || "",
        }));

        return {
          success: true,
          currentStatus: data.dist?.transactionStatus || "Unknown",
          events,
        };
      }

      return { success: false, error: data.message || "Tracking failed" };
    } catch (err: any) {
      return { success: false, error: `PostEx tracking error: ${err.message}` };
    }
  }

  async cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: "PostEx API token not configured" };
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/services/integration/api/order/v3/cancel-order/${shipmentId}`,
        { method: "PUT", headers: this.headers }
      );
      const data = await res.json();
      return { success: data.statusCode === 200, error: data.message };
    } catch (err: any) {
      return { success: false, error: `PostEx cancel error: ${err.message}` };
    }
  }

  async getRates(req: CourierRateRequest): Promise<CourierRateResponse> {
    if (!this.isConfigured) {
      const baseRate = 180;
      const weightCharge = Math.ceil((req.weight || 500) / 1000) * 45;
      return {
        success: true,
        courierName: this.name,
        rate: baseRate + weightCharge,
        estimatedDays: "2-3 days",
        serviceType: "standard",
      };
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/services/integration/api/order/v3/get-tariff?` +
        `pickupCityName=${encodeURIComponent(req.pickupCity)}` +
        `&deliveryCityName=${encodeURIComponent(req.destinationCity)}` +
        `&orderWeight=${Math.ceil((req.weight || 500) / 1000)}`,
        { headers: this.headers }
      );
      const data = await res.json();

      if (data.statusCode === 200) {
        return {
          success: true,
          courierName: this.name,
          rate: data.dist?.rate || data.dist?.totalCharges || 220,
          estimatedDays: data.dist?.estimatedDays || "2-3 days",
          serviceType: "standard",
        };
      }

      return {
        success: true,
        courierName: this.name,
        rate: 220,
        estimatedDays: "2-3 days",
        serviceType: "standard",
      };
    } catch {
      return {
        success: true,
        courierName: this.name,
        rate: 220,
        estimatedDays: "2-3 days",
        serviceType: "standard",
      };
    }
  }
}
