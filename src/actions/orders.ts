"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { reserveStock, releaseStock, soldStock } from "./inventory";
import { getPlatformConfig } from "./config";
import { logAdminAction } from "./audit";
import { creditWallet, debitWallet } from "./wallet";

// ── Place Order ─────────────────────────────────────────────────────────────

type PlaceOrderParams = {
  productId: string;
  variant: string;
  quantity?: number;
  customerName: string;
  phone1: string;
  phone2?: string;
  city: string;
  address: string;
  collect: number;
  courier?: string;      // Selected courier name
  shippingFee?: number;  // Selected courier rate
};

export async function placeOrder(params: PlaceOrderParams) {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1";
  const quantity = params.quantity || 1;

  return await db.$transaction(async (tx) => {
    // Verify reseller
    const reseller = await tx.reseller.findUnique({ where: { id: resellerId } });
    if (!reseller) throw new Error("Reseller not found");

    // Lock checks
    if (reseller.isLocked) {
      throw new Error(
        "Your account is temporarily locked because your initial orders were unsuccessful. Submit Rs. 500 COD security payment to unlock."
      );
    }
    if (reseller.balance <= -500) {
      throw new Error("Account locked — Top up PKR 500 to continue placing orders.");
    }

    // Get product + auto-route to vendor
    const product = await tx.product.findUnique({ where: { id: params.productId } });
    if (!product) throw new Error("Product not found");
    if (!product.isActive || product.approvalStatus !== "APPROVED") {
      throw new Error("Product is not available for ordering.");
    }

    const available = product.stock - product.reservedStock;
    if (available < quantity) throw new Error(`Only ${available} units available. Requested: ${quantity}`);

    // Enforce minimum selling price
    if (product.minSellingPrice && params.collect < product.minSellingPrice) {
      throw new Error(`COD amount cannot be less than the minimum selling price of PKR ${product.minSellingPrice}`);
    }

    // Get vendor pickup address
    let pickupCity = "";
    let pickupAddress = "";
    let pickupPhone = "";

    if (product.vendorId) {
      const vendor = await tx.vendor.findUnique({
        where: { id: product.vendorId },
        select: { pickupCity: true, pickupAddress: true, pickupPhone: true },
      });
      if (vendor) {
        pickupCity = vendor.pickupCity || "";
        pickupAddress = vendor.pickupAddress || "";
        pickupPhone = vendor.pickupPhone || "";
      }
    }

    // Get configurable fees from PlatformConfig
    const config = await getPlatformConfig();
    const deliveryFee = params.shippingFee || config.deliveryFee;
    const platformFee = config.platformFeePerOrder;
    const vendorFee = Math.round(platformFee * (config.vendorFeePercent / 100));
    const resellerFee = Math.round(platformFee * (config.resellerFeePercent / 100));
    const profit = params.collect - (product.wholesale * quantity) - deliveryFee - resellerFee;

    // Generate unique order ID
    const orderCount = await tx.order.count();
    const orderId = `PD-${String(1000 + orderCount + 1).padStart(4, "0")}`;

    // Create order
    const order = await tx.order.create({
      data: {
        id: orderId,
        resellerId,
        vendorId: product.vendorId,         // ← auto-routing
        productId: product.id,
        productTitle: product.title,
        image: JSON.parse(product.images)[0],
        variant: params.variant,
        quantity,
        customerName: params.customerName,
        phone1: params.phone1,
        phone2: params.phone2 || "",
        city: params.city,
        address: params.address,
        collect: params.collect,
        wholesale: product.wholesale,
        delivery: deliveryFee,
        shippingFee: params.shippingFee || 0,
        platformFee,
        vendorFee,
        resellerFee,
        profit,
        status: "Pending",
        settlementStatus: "Pending",
        // Auto-fill from vendor
        pickupCity: pickupCity || null,
        pickupAddress: pickupAddress || null,
        pickupPhone: pickupPhone || null,
        weight: product.weight || null,
        // Courier if selected
        courier: params.courier || null,
      },
    });

    // Reserve stock
    const reserved = await reserveStock(tx, product.id, quantity, orderId, resellerId);
    if (!reserved) throw new Error("Could not reserve stock — concurrent order conflict.");

    // Update reseller order count
    await tx.reseller.update({
      where: { id: resellerId },
      data: { totalOrdersPlaced: { increment: 1 } },
    });

    // Order timeline entry
    await tx.orderTimeline.create({
      data: {
        orderId,
        prevStatus: null,
        newStatus: "Pending",
        actor: resellerId,
        note: `Order placed by reseller — Qty: ${quantity}, COD: PKR ${params.collect}`,
      },
    });

    // Notifications
    await tx.notification.create({
      data: {
        target: "admin",
        title: "🛒 New Order",
        message: `Order ${orderId} (PKR ${params.collect}) from ${reseller.brandName} — ${product.title} x${quantity}`,
        type: "info",
      },
    });
    if (product.vendorId) {
      await tx.notification.create({
        data: {
          target: product.vendorId,
          title: "📦 New Order for Your Product",
          message: `Order ${orderId} placed for "${product.title}" x${quantity}. Prepare for packing.`,
          type: "info",
        },
      });
    }

    return order;
  }, {
    timeout: 15000,
  });
}

// ── Update Order Status ─────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  adminNote?: string,
  trackingId?: string,
  courierName?: string,
  extra?: {
    cancelReason?: string;
    cancelledBy?: string;
    rtoReason?: string;
    awbNumber?: string;
    labelUrl?: string;
  }
) {
  const session = await getServerSession(authOptions);
  const actor = session?.user?.id || "admin";
  if (session?.user?.role && !["admin", "reseller"].includes(session.user.role || "")) {
    throw new Error("Unauthorized");
  }

  return await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.status === newStatus) return order;

    const prevStatus = order.status;
    const qty = order.quantity || 1;

    // Build update data
    const updateData: any = { status: newStatus, updatedAt: new Date() };
    if (trackingId) updateData.trackingId = trackingId;
    if (courierName) updateData.courier = courierName;
    if (extra?.awbNumber) updateData.awbNumber = extra.awbNumber;
    if (extra?.labelUrl) updateData.labelUrl = extra.labelUrl;

    // Status-specific logic
    switch (newStatus) {
      case "Confirmed":
        // Admin confirms order — no financial impact yet
        break;

      case "CourierBooked":
        // Courier has been booked (handled by courier action separately)
        break;

      case "AWBGenerated":
        if (!order.awbNumber && !extra?.awbNumber) {
          throw new Error("AWB number required");
        }
        break;

      case "ReadyForPickup":
        // Vendor has packed the order — ready for courier pickup
        if (order.vendorId) {
          await tx.notification.create({
            data: {
              target: "admin",
              title: "📦 Ready for Pickup",
              message: `Order ${orderId} is ready for courier pickup from vendor.`,
              type: "info",
            },
          });
        }
        break;

      case "PickedUp":
        // Courier has picked up the parcel
        break;

      case "InTransit":
        break;

      case "OutForDelivery":
        await tx.notification.create({
          data: {
            target: order.resellerId,
            title: "🚚 Out for Delivery",
            message: `Order ${orderId} is out for delivery to ${order.customerName}.`,
            type: "info",
          },
        });
        break;

      case "Cancelled":
        // Release reserved stock
        await releaseStock(tx, order.productId, qty, orderId, actor, adminNote);
        // COD lock: monitor first N orders
        await checkAndApplyCodLock(tx, order, actor);
        updateData.settlementStatus = "Cancelled";
        if (extra?.cancelReason) updateData.cancelReason = extra.cancelReason;
        updateData.cancelledBy = extra?.cancelledBy || (session?.user?.role || "admin");
        break;

      case "StockReserved":
        // Confirm the stock reservation (already done at order creation)
        break;

      case "Shipped":
        if (!order.trackingId && !trackingId) throw new Error("Tracking ID required before shipping");
        break;

      case "Delivered":
        // Mark settlement eligible — settlement happens at SettlementEligible
        updateData.settlementStatus = "Eligible";
        break;

      case "SettlementEligible":
        updateData.settlementStatus = "Eligible";
        break;

      case "Settled":
        // Run settlement
        await processSettlement(tx, order);
        updateData.settlementStatus = "Settled";
        break;

      case "Returned":
      case "RTO":
        // Return stock to available
        await releaseStock(tx, order.productId, qty, orderId, actor, `${newStatus} — stock released`);
        // Get configurable RTO charge
        const rtoConfig = await getPlatformConfig();
        const rtoCharge = rtoConfig.rtoCharge || 250;
        // Penalty deduction
        await debitWallet(order.resellerId, "reseller", rtoCharge, `RTO Penalty — ${orderId}`, "Penalty");
        // COD lock check
        await checkAndApplyCodLock(tx, order, actor);
        // Save RTO details
        updateData.rtoReason = extra?.rtoReason || adminNote || "Customer refused delivery";
        updateData.rtoDate = new Date();
        updateData.rtoCharge = rtoCharge;
        updateData.vendorReturnStatus = "Pending";
        break;

      case "FailedDelivery":
        await tx.notification.create({
          data: {
            target: order.resellerId,
            title: "⚠️ Delivery Failed",
            message: `Order ${orderId} delivery failed. Admin will retry or return.`,
            type: "warning",
          },
        });
        break;
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Record timeline
    await tx.orderTimeline.create({
      data: {
        orderId,
        prevStatus,
        newStatus,
        actor,
        note: adminNote,
      },
    });

    // Audit log
    await logAdminAction({
      adminId: actor,
      action: "UPDATE_ORDER_STATUS",
      entity: "Order",
      entityId: orderId,
      prevValue: prevStatus,
      newValue: newStatus,
      note: adminNote,
    });

    // Notify reseller
    await tx.notification.create({
      data: {
        target: order.resellerId,
        title: `Order ${orderId} Updated`,
        message: `Status changed to: ${newStatus}${trackingId ? ` — Tracking: ${trackingId}` : ""}`,
        type: newStatus === "Delivered" || newStatus === "Settled" ? "success" : "info",
      },
    });

    return updated;
  });
}

// ── Settlement Logic ────────────────────────────────────────────────────────

async function processSettlement(tx: any, order: any) {
  // Prevent double settlement
  const existing = await tx.ledger.findFirst({
    where: { resellerId: order.resellerId, tag: "Profit", label: { contains: order.id } },
  });
  if (existing) return; // Already settled

  // Mark stock as sold
  await soldStock(tx, order.productId, 1, order.id);

  // Credit reseller profit
  await tx.ledger.create({
    data: {
      resellerId: order.resellerId,
      orderId: order.id,
      label: `Profit — Order ${order.id} (${order.productTitle})`,
      tag: "Profit",
      amount: order.profit,
    },
  });
  await tx.reseller.update({
    where: { id: order.resellerId },
    data: { balance: { increment: order.profit } },
  });

  // Credit vendor (wholesale minus vendorFee)
  if (order.vendorId) {
    const vendorAmount = order.wholesale - order.vendorFee;
    await tx.ledger.create({
      data: {
        vendorId: order.vendorId,
        orderId: order.id,
        label: `Sale — Order ${order.id} (${order.productTitle})`,
        tag: "Sale",
        amount: vendorAmount,
      },
    });
    await tx.vendor.update({
      where: { id: order.vendorId },
      data: { balance: { increment: vendorAmount } },
    });
  }

  // Platform fee deducted (already factored into profit calculation)
  // Notifications
  await tx.notification.create({
    data: {
      target: order.resellerId,
      title: "💰 Profit Credited",
      message: `PKR ${Math.round(order.profit).toLocaleString()} credited for Order ${order.id}.`,
      type: "success",
    },
  });
  if (order.vendorId) {
    await tx.notification.create({
      data: {
        target: order.vendorId,
        title: "💰 Sale Settled",
        message: `Order ${order.id} settled. Sale amount credited to your wallet.`,
        type: "success",
      },
    });
  }
}

// ── COD Lock Check ──────────────────────────────────────────────────────────

async function checkAndApplyCodLock(tx: any, order: any, actor: string) {
  const reseller = await tx.reseller.findUnique({ where: { id: order.resellerId } });
  if (!reseller) return;

  const config = await getPlatformConfig();
  const newFailed = reseller.totalOrdersFailed + 1;
  const shouldLock =
    reseller.totalOrdersPlaced <= config.firstOrdersMonitor &&
    newFailed >= reseller.totalOrdersPlaced &&
    reseller.totalOrdersPlaced > 0;

  await tx.reseller.update({
    where: { id: order.resellerId },
    data: {
      totalOrdersFailed: { increment: 1 },
      isLocked: shouldLock ? true : reseller.isLocked,
    },
  });

  if (shouldLock) {
    await tx.notification.create({
      data: {
        target: order.resellerId,
        title: "🔒 Account Temporarily Locked",
        message:
          "Your initial orders were unsuccessful. Submit Rs. 500 COD security payment to unlock your account.",
        type: "error",
      },
    });
    await tx.notification.create({
      data: {
        target: "admin",
        title: "🔒 Reseller Account Locked",
        message: `Reseller ${reseller.brandName} (${order.resellerId}) account locked after failed initial orders.`,
        type: "warning",
      },
    });
  }
}

// ── Unlock Request ──────────────────────────────────────────────────────────

export async function processUnlockRequest(
  unlockId: string,
  approve: boolean,
  adminNote?: string
) {
  const session = await getServerSession(authOptions);
  const adminId = session?.user?.id || "admin";

  const unlock = await db.unlock.findUnique({ where: { id: unlockId } });
  if (!unlock) throw new Error("Unlock request not found");
  if (unlock.status !== "Pending") throw new Error("Request already processed");

  await db.unlock.update({
    where: { id: unlockId },
    data: {
      status: approve ? "Approved" : "Rejected",
      adminNote: adminNote ?? null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });

  if (approve) {
    const config = await getPlatformConfig();
    await db.$transaction(async (tx) => {
      await tx.reseller.update({
        where: { id: unlock.resellerId },
        data: {
          isLocked: false,
          codReserve: { increment: config.codReserveAmount },
        },
      });
      await tx.ledger.create({
        data: {
          resellerId: unlock.resellerId,
          label: `COD Security Deposit — Account Unlocked (TRX: ${unlock.trxId})`,
          tag: "COD Reserve",
          amount: config.codReserveAmount,
        },
      });
      await tx.notification.create({
        data: {
          target: unlock.resellerId,
          title: "✅ Account Unlocked",
          message: `Your account is unlocked. Rs. ${config.codReserveAmount} held as COD security reserve.`,
          type: "success",
        },
      });
    });
  } else {
    await db.notification.create({
      data: {
        target: unlock.resellerId,
        title: "❌ Unlock Request Rejected",
        message: adminNote
          ? `Your unlock request was rejected. Reason: ${adminNote}`
          : "Your unlock request was rejected. Please contact support.",
        type: "error",
      },
    });
  }

  await logAdminAction({
    adminId,
    action: approve ? "APPROVE_UNLOCK" : "REJECT_UNLOCK",
    entity: "Unlock",
    entityId: unlockId,
    prevValue: "Pending",
    newValue: approve ? "Approved" : "Rejected",
    note: adminNote,
  });

  return { success: true };
}

// ── Get Order Timeline ──────────────────────────────────────────────────────

export async function getOrderTimeline(orderId: string) {
  return await db.orderTimeline.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
}

// ── Dev: Simulate Lock State ─────────────────────────────────────────────────
// Sets isLocked=true and debits 500 to simulate 2 RTO orders scenario

export async function simulateLockState(resellerId: string) {
  await db.reseller.update({
    where: { id: resellerId },
    data: {
      isLocked: true,
      totalOrdersFailed: { increment: 2 },
      balance: { decrement: 500 },
    },
  });
  await db.ledger.create({
    data: {
      resellerId,
      label: "RTO Penalties (Simulated) — 2 failed orders",
      tag: "Penalty",
      amount: -500,
    },
  });
  await db.notification.create({
    data: {
      target: resellerId,
      title: "🔒 Account Locked",
      message: "Your account has been locked due to 2 returned orders. Submit Rs. 500 COD security to unlock.",
      type: "error",
    },
  });
}

// ── Dev: Reset Lock State ────────────────────────────────────────────────────

export async function resetLockState(resellerId: string) {
  await db.reseller.update({
    where: { id: resellerId },
    data: {
      isLocked: false,
      totalOrdersFailed: 0,
      balance: { increment: 500 },
    },
  });
}
