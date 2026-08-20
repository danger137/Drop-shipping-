"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAdminAction } from "./audit";

/**
 * Save a Shopify store connection for a reseller.
 * Token is received from the OAuth callback and stored server-side only.
 */
export async function connectShopifyStore(shopDomain: string, accessToken: string) {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1"; // fallback for dev

  const normalized = shopDomain.replace(/https?:\/\//, "").replace(/\/$/, "");

  await db.reseller.update({
    where: { id: resellerId },
    data: {
      shopifyDomain: normalized,
      shopifyToken: accessToken,
      shopifyConnected: true,
    },
  });

  return { success: true, domain: normalized };
}

/**
 * Disconnect Shopify from reseller account
 */
export async function disconnectShopifyStore() {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1";

  await db.reseller.update({
    where: { id: resellerId },
    data: {
      shopifyDomain: null,
      shopifyToken: null,
      shopifyConnected: false,
    },
  });

  // Remove all mappings for this reseller
  await db.shopifyMapping.deleteMany({ where: { resellerId } });

  return { success: true };
}

/**
 * Get Shopify connection status (safe — no token exposed)
 */
export async function getShopifyStatus() {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1";

  const reseller = await db.reseller.findUnique({
    where: { id: resellerId },
    select: { shopifyDomain: true, shopifyConnected: true },
  });

  const mappings = await db.shopifyMapping.findMany({
    where: { resellerId },
    select: { productId: true, shopifyProductId: true, shopifyVariantId: true, createdAt: true },
  });

  return {
    connected: reseller?.shopifyConnected ?? false,
    domain: reseller?.shopifyDomain ?? null,
    mappings,
  };
}

/**
 * Save a product mapping between PakDropship product and Shopify product.
 * In production this would also call the Shopify REST/GraphQL API.
 */
export async function pushProductToShopify(productId: string, shopifyProductId?: string) {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1";

  const reseller = await db.reseller.findUnique({
    where: { id: resellerId },
    select: { shopifyConnected: true, shopifyDomain: true, shopifyToken: true },
  });

  if (!reseller?.shopifyConnected) {
    throw new Error("Connect your Shopify store first.");
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  // In production: call Shopify API using reseller.shopifyToken to create product
  // For now, we simulate with a mock shopify product ID
  const mockShopifyId = shopifyProductId || `shopify-${productId}-${Date.now()}`;

  // Check if mapping already exists — update, don't duplicate
  const existing = await db.shopifyMapping.findFirst({
    where: { resellerId, productId },
  });

  if (existing) {
    await db.shopifyMapping.update({
      where: { id: existing.id },
      data: { shopifyProductId: mockShopifyId },
    });
  } else {
    await db.shopifyMapping.create({
      data: {
        resellerId,
        productId,
        shopifyProductId: mockShopifyId,
      },
    });
  }

  return { success: true, shopifyProductId: mockShopifyId, domain: reseller.shopifyDomain };
}

/**
 * Simulate an inbound Shopify order sync (called by webhook in production)
 */
export async function syncShopifyOrders() {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1";

  // In production: fetch /admin/api/orders.json from Shopify and create PakDropship orders
  return { success: true, synced: 0, message: "No new orders from Shopify." };
}

/**
 * Generate the Shopify OAuth URL for the reseller's store domain.
 * The actual OAuth redirect should be handled server-side via /api/shopify/callback.
 */
export async function generateShopifyAuthUrl(shopDomain: string) {
  const session = await getServerSession(authOptions);
  const resellerId = session?.user?.resellerId || "r1";

  const clientId = process.env.SHOPIFY_CLIENT_ID || "demo-client-id";
  const scopes = "read_orders,write_orders,read_products,write_products";
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/shopify/callback`;
  const normalized = shopDomain.replace(/https?:\/\//, "").replace(/\/$/, "");

  const url = `https://${normalized}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${resellerId}`;
  return { url, domain: normalized };
}
