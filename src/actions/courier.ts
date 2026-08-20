"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAvailableRates, getCourierService } from "@/lib/courier";
import type { CourierRateRequest } from "@/lib/courier/interface";

/**
 * Get shipping rates from all available couriers.
 * Called at checkout to show rate comparison.
 */
export async function getShippingRates(params: {
  productId: string;
  destinationCity: string;
  codAmount: number;
}) {
  // Get product details (weight, fragile)
  const product = await db.product.findUnique({
    where: { id: params.productId },
    select: { weight: true, fragile: true, vendorId: true },
  });

  if (!product) throw new Error("Product not found");

  // Get vendor pickup city
  let pickupCity = "Lahore"; // Default fallback
  if (product.vendorId) {
    const vendor = await db.vendor.findUnique({
      where: { id: product.vendorId },
      select: { pickupCity: true },
    });
    if (vendor?.pickupCity) pickupCity = vendor.pickupCity;
  }

  const rateReq: CourierRateRequest = {
    pickupCity,
    destinationCity: params.destinationCity,
    weight: product.weight || 500,
    codAmount: params.codAmount,
    isFragile: product.fragile,
  };

  const rates = await getAvailableRates(rateReq);
  return { rates, pickupCity, weight: product.weight };
}

/**
 * Book a courier shipment for an order.
 * Creates CourierShipment record and updates order with tracking info.
 */
export async function bookCourierShipment(orderId: string, courierName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        select: { title: true, weight: true, vendorId: true },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  // Get vendor pickup address
  let pickupAddress = "";
  let pickupCity = "";
  let pickupPhone = "";
  let pickupPersonName = "";

  if (order.product.vendorId) {
    const vendor = await db.vendor.findUnique({
      where: { id: order.product.vendorId },
      select: {
        pickupAddress: true, pickupCity: true,
        pickupPhone: true, pickupPersonName: true,
      },
    });
    if (vendor) {
      pickupAddress = vendor.pickupAddress || "";
      pickupCity = vendor.pickupCity || "";
      pickupPhone = vendor.pickupPhone || "";
      pickupPersonName = vendor.pickupPersonName || "";
    }
  }

  // Use the order's pickup info if already set (overrides vendor)
  if (order.pickupAddress) pickupAddress = order.pickupAddress;
  if (order.pickupCity) pickupCity = order.pickupCity;
  if (order.pickupPhone) pickupPhone = order.pickupPhone;

  const courier = getCourierService(courierName);
  const result = await courier.bookShipment({
    orderId: order.id,
    customerName: order.customerName,
    phone: order.phone1,
    address: order.address,
    city: order.city,
    codAmount: order.collect,
    weight: order.weight || order.product.weight || 500,
    description: order.productTitle,
    pickupPersonName,
    pickupPhone,
    pickupAddress,
    pickupCity,
  });

  if (!result.success) {
    throw new Error(result.error || "Courier booking failed");
  }

  // Create CourierShipment record
  const shipment = await db.courierShipment.create({
    data: {
      orderId: order.id,
      courierName: courier.name,
      shipmentId: result.shipmentId,
      trackingId: result.trackingId,
      trackingUrl: result.trackingUrl,
      awbNumber: result.awbNumber,
      codAmount: order.collect,
      weight: order.weight || order.product.weight,
      pickupCity,
      pickupAddress,
      deliveryAddress: order.address,
      deliveryCity: order.city,
      status: "Booked",
      courierResponse: JSON.stringify(result.rawResponse),
    },
  });

  // Update order with courier info
  await db.order.update({
    where: { id: orderId },
    data: {
      trackingId: result.trackingId,
      courier: courier.name,
      awbNumber: result.awbNumber,
      labelUrl: result.label,
      courierShipmentId: shipment.id,
      status: "CourierBooked",
      pickupCity,
      pickupAddress,
      pickupPhone,
    },
  });

  // Timeline entry
  await db.orderTimeline.create({
    data: {
      orderId,
      prevStatus: order.status,
      newStatus: "CourierBooked",
      actor: session.user.id || "admin",
      note: `Booked with ${courier.name} — AWB: ${result.awbNumber || result.trackingId}`,
    },
  });

  // Notify reseller
  await db.notification.create({
    data: {
      target: order.resellerId,
      title: "📦 Courier Booked",
      message: `Order ${orderId} booked with ${courier.name}. Tracking: ${result.trackingId}`,
      type: "info",
    },
  });

  return {
    success: true,
    trackingId: result.trackingId,
    awbNumber: result.awbNumber,
    courierName: courier.name,
  };
}

/**
 * Track a shipment by its tracking ID.
 */
export async function trackShipment(trackingId: string) {
  const shipment = await db.courierShipment.findFirst({
    where: { trackingId },
  });

  if (!shipment) throw new Error("Shipment not found");

  const courier = getCourierService(shipment.courierName);
  const result = await courier.trackShipment(trackingId);

  if (result.success && result.events) {
    // Update stored tracking events
    await db.courierShipment.update({
      where: { id: shipment.id },
      data: {
        trackingEvents: JSON.stringify(result.events),
        status: result.currentStatus || shipment.status,
      },
    });
  }

  return result;
}

/**
 * Cancel a courier shipment.
 */
export async function cancelCourierShipment(orderId: string) {
  const shipment = await db.courierShipment.findUnique({
    where: { orderId },
  });

  if (!shipment) throw new Error("No shipment found for this order");
  if (!shipment.shipmentId) throw new Error("No shipment ID to cancel");

  const courier = getCourierService(shipment.courierName);
  const result = await courier.cancelShipment(shipment.shipmentId);

  if (result.success) {
    await db.courierShipment.update({
      where: { id: shipment.id },
      data: { status: "Cancelled" },
    });
  }

  return result;
}
