/**
 * ICourierService — Modular courier integration interface.
 * Implement this for each courier: PostEx, Trax, Leopards, M&P, etc.
 */

export interface CourierShipmentRequest {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  codAmount: number;
  weight?: number; // grams
  description?: string;
  // Vendor pickup details
  pickupPersonName?: string;
  pickupPhone?: string;
  pickupAddress?: string;
  pickupCity?: string;
}

export interface CourierShipmentResponse {
  success: boolean;
  shipmentId?: string;
  trackingId?: string;
  trackingUrl?: string;
  awbNumber?: string;
  label?: string; // Base64 or URL to printable label
  error?: string;
  rawResponse?: any;
}

export interface CourierTrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  description: string;
}

export interface CourierTrackingResponse {
  success: boolean;
  currentStatus?: string;
  events?: CourierTrackingEvent[];
  error?: string;
}

export interface CourierRateRequest {
  pickupCity: string;
  destinationCity: string;
  weight: number;      // grams
  codAmount: number;
  isFragile?: boolean;
}

export interface CourierRateResponse {
  success: boolean;
  courierName: string;
  rate: number;       // PKR
  estimatedDays: string; // e.g. "2-3 days"
  serviceType?: string; // e.g. "standard", "express"
  error?: string;
}

export interface ICourierService {
  name: string;
  bookShipment(req: CourierShipmentRequest): Promise<CourierShipmentResponse>;
  trackShipment(trackingId: string): Promise<CourierTrackingResponse>;
  cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }>;
  getRates(req: CourierRateRequest): Promise<CourierRateResponse>;
}
