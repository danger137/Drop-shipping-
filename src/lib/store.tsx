import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { fetchAppData } from "@/actions/appData";
import { placeOrder as serverPlaceOrder, updateOrderStatus, getOrderTimeline, simulateLockState, resetLockState } from "@/actions/orders";
import { requestWithdrawal, approveWithdrawal } from "@/actions/wallet";
import { sendMessage, markMessagesRead, markNotificationsReadAction, markSingleNotificationReadAction } from "@/actions/messages";
import { requestProductEdit as reqEdit, requestProductDelete as reqDel, approveProductAction as appAction, rejectProductAction as rejAction } from "@/actions/vendorProduct";
import { processUnlockRequest } from "@/actions/orders";
import { submitKycAction } from "@/actions/kyc";
import { requestOrderEditAction, approveOrderEditAction, rejectOrderEditAction } from "@/actions/orderEdit";
import { updateResellerProfileAction } from "@/actions/profile";

export type Role = "guest" | "reseller" | "vendor" | "admin";

export type AuthUser = { id: string; email: string; role: Role; resellerId?: string; vendorId?: string; };

export type Reseller = {
  id: string; name: string; brandName: string; brandLogo: string | null; phone: string;
  email: string | null; storeAddress: string | null; supportEmail: string | null;
  balance: number; pendingBalance: number; codReserve: number; totalWithdrawn: number;
  isLocked: boolean; totalOrdersPlaced: number; totalOrdersFailed: number;
  shopifyConnected: boolean; shopifyDomain: string | null;
};

export type Vendor = {
  id: string; name: string; brandName: string; brandLogo: string | null; phone: string;
  email: string | null; ownerName: string | null; cnicNumber: string | null;
  businessAddress: string | null;
  pickupPersonName: string | null; pickupPhone: string | null;
  pickupAddress: string | null; pickupCity: string | null;
  pickupArea: string | null; postalCode: string | null;
  returnAddress: string | null; returnCity: string | null;
  returnContact: string | null; returnPhone: string | null;
  bankName: string; accountName: string; accountNumber: string; iban: string | null;
  balance: number; pendingBalance: number; totalWithdrawn: number;
  approvalStatus: string; kycStatus: string;
};

export type Category = { id: string; title: string; image: string; };

export type Product = {
  id: string; sku: string | null; vendorId: string | null; categoryId: string;
  title: string; hook: string | null; description: string | null; brand: string | null;
  images: any; videoUrl: string | null;
  colors: any; sizes: any; colorPricing: any; sizePricing: any; colorImages: any;
  wholesale: number; suggested: number; minSellingPrice: number | null;
  stock: number; reservedStock: number; soldQty: number; lowStockThreshold: number;
  weight: number; dimensions: string | null;
  returnable: boolean; fragile: boolean;
  approvalStatus: string; rejectionReason: string | null; isActive: boolean;
  createdAt: any; updatedAt: any;
};

export type Order = {
  id: string; resellerId: string; vendorId: string | null; productId: string;
  productTitle: string; image: string | null; variant: string | null; quantity: number;
  customerName: string; phone1: string; phone2: string | null;
  city: string; address: string;
  collect: number; wholesale: number; delivery: number; shippingFee: number;
  platformFee: number; vendorFee: number; resellerFee: number; profit: number;
  status: string; settlementStatus: string;
  trackingId: string | null; courier: string | null;
  awbNumber: string | null; labelUrl: string | null;
  pickupCity: string | null; pickupAddress: string | null; weight: number | null;
  isPrinted: boolean; notes: string | null;
  cancelReason: string | null; cancelledBy: string | null;
  rtoReason: string | null; rtoDate: any | null; rtoCharge: number;
  vendorReturnStatus: string | null;
  createdAt: any; updatedAt: any;
  pendingEdits?: any; editStatus?: string | null;
};

export type Ledger = { id: string; resellerId: string | null; vendorId: string | null; orderId: string | null; label: string; tag: string; amount: number; date: any; proof: string | null; status: string; };
export type Payout = { id: string; resellerId: string | null; vendorId: string | null; amount: number; method: string; accountName: string; accountNumber: string; status: string; proof: string | null; adminNote: string | null; paymentRef: string | null; requestedAt: any; processedAt: any; };
export type Unlock = { id: string; resellerId: string; trxId: string; receipt: string; amount: number; method: string; status: string; adminNote: string | null; date: any; reviewedAt: any; };
export type Message = { id: string; resellerId: string | null; from: string; text: string; attachmentUrl: string | null; attachmentType: string | null; isRead: boolean; at: any; };
export type Notification = { id: string; target: string; title: string; message: string; type: string; read: boolean; date: any; };
export type KycRequest = {
  id: string; email: string; passwordHash: string; name: string; phone: string; cnic: string;
  idFront: string | null; idBack: string | null; bankName: string; accountName: string;
  accountNumber: string; iban: string | null; accountType: string; status: string;
  adminNote: string | null; reviewedBy: string | null; date: any;
  businessAddress?: string | null; pickupAddress?: string | null; pickupCity?: string | null;
  pickupPhone?: string | null; returnAddress?: string | null; returnCity?: string | null;
  returnPhone?: string | null;
  stockVideo?: string | null;
  stockImages?: string | null;
};
export type PlatformConfig = { id: string; deliveryFee: number; platformFeePerOrder: number; vendorFeePercent: number; resellerFeePercent: number; minWithdrawal: number; codReserveAmount: number; firstOrdersMonitor: number; rtoCharge: number; };

type State = {
  role: Role;
  currentUser: AuthUser | null;
  config: PlatformConfig | null;
  categories: Category[];
  products: Product[];
  resellers: Reseller[];
  vendors: Vendor[];
  currentResellerId: string;
  currentVendorId: string;
  orders: Order[];
  ledger: Ledger[];
  payouts: Payout[];
  unlocks: Unlock[];
  messages: Message[];
  notifications: Notification[];
  kycRequests: KycRequest[];
  productActionRequests: any[];
};

const emptyState: State = {
  role: "guest",
  currentUser: null,
  config: null,
  categories: [],
  products: [],
  orders: [],
  ledger: [],
  payouts: [],
  unlocks: [],
  messages: [],
  notifications: [],
  resellers: [],
  vendors: [],
  kycRequests: [],
  productActionRequests: [],
  currentResellerId: "r1",
  currentVendorId: "v1",
};

export interface Ctx {
  s: State;
  me: Reseller;
  meVendor: Vendor;
  locked: boolean;
  isDataLoading: boolean;
  refreshData: () => Promise<void>;
  setRole: (role: Role) => void;
  setCurrentReseller: (id: string) => void;
  setCurrentVendor: (id: string) => void;
  updateBrand: (patch: Partial<Reseller>) => Promise<void>;
  updateVendorProfile: (data: any) => Promise<void>;

  submitVendorProduct: (p: any) => Promise<void>;
  approveVendorProduct: (id: string) => Promise<void>;
  rejectVendorProduct: (id: string) => Promise<void>;
  requestProductEdit: (productId: string, data: any) => Promise<void>;
  requestProductDelete: (productId: string) => Promise<void>;
  approveProductAction: (requestId: string) => Promise<void>;
  rejectProductAction: (requestId: string, reason: string) => Promise<void>;

  placeOrder: (o: Omit<Order, "id" | "status" | "createdAt" | "updatedAt" | "statusHistory">) => Promise<void>;
  setStatus: (id: string, status: Order["status"], note?: string, trackingId?: string, courier?: string) => Promise<void>;
  bookOrders: () => void;
  requestOrderEdit: (id: string, edits: Partial<Order>) => Promise<void>;
  approveOrderEdit: (id: string) => Promise<void>;
  rejectOrderEdit: (id: string) => Promise<void>;

  credit: () => void;
  simulateLock: () => Promise<void>;
  resetLock: () => Promise<void>;
  requestPayout: (p: { amount: number; method: string; accountName: string; accountNumber: string }) => Promise<void>;
  markPaid: (id: string, approve: boolean, paymentRef?: string, adminNote?: string) => Promise<void>;
  requestUnlock: (trxId: string, receipt: string) => Promise<void>;
  approveUnlock: (id: string, approve: boolean, adminNote?: string) => Promise<void>;

  send: (resellerId: string, from: Message["from"], text: string, attachmentUrl?: string, attachmentType?: Message["attachmentType"]) => Promise<void>;
  markRead: (resellerId: string, reader: "reseller" | "admin") => Promise<void>;
  markNotificationsRead: (target: string) => Promise<void>;
  markSingleNotificationRead: (id: string) => Promise<void>;

  submitKyc: (formData: any) => Promise<void>;
  approveKyc: (id: string) => Promise<void>;
  rejectKyc: (id: string) => Promise<void>;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(emptyState);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { data: session, status } = useSession();
  const isFetchingRef = useRef(false);

  const loadData = async (isBackground = false) => {
    if (status === "loading" || isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!isBackground) setIsDataLoading(true);
    try {
      const data = await fetchAppData();
      set(prev => ({
        ...prev,
        ...data.state,
        config: data.config ?? null,
        products: data.state.products.map((p: any) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || "[]"),
          colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || "[]"),
          sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || "[]"),
          colorPricing: p.colorPricing ? (typeof p.colorPricing === "string" ? JSON.parse(p.colorPricing) : p.colorPricing) : {},
          sizePricing: p.sizePricing ? (typeof p.sizePricing === "string" ? JSON.parse(p.sizePricing) : p.sizePricing) : {},
        })),
        role: data.role as Role,
        currentUser: session?.user as any || null,
        resellers: data.state.resellers?.length > 0 ? data.state.resellers : (data.state.me ? [data.state.me] : []),
        vendors: data.state.vendors?.length > 0 ? data.state.vendors : (data.state.meVendor ? [data.state.meVendor] : []),
        kycRequests: data.state.kycRequests ?? [],
        productActionRequests: (data.state.productActionRequests ?? []).map((r: any) => ({
          ...r,
          product: r.product ? {
            ...r.product,
            images: Array.isArray(r.product.images) ? r.product.images : JSON.parse(r.product.images || "[]"),
            colors: Array.isArray(r.product.colors) ? r.product.colors : JSON.parse(r.product.colors || "[]"),
            sizes: Array.isArray(r.product.sizes) ? r.product.sizes : JSON.parse(r.product.sizes || "[]"),
            colorPricing: r.product.colorPricing ? (typeof r.product.colorPricing === "string" ? JSON.parse(r.product.colorPricing) : r.product.colorPricing) : {},
            sizePricing: r.product.sizePricing ? (typeof r.product.sizePricing === "string" ? JSON.parse(r.product.sizePricing) : r.product.sizePricing) : {},
          } : null,
        })),
        currentResellerId: data.state.me?.id || (data.state.resellers?.[0]?.id ?? ""),
        currentVendorId: data.state.meVendor?.id || (data.state.vendors?.[0]?.id ?? ""),
      }));
    } catch (e: any) {
      console.error("fetchAppData error:", e.message);
    } finally {
      isFetchingRef.current = false;
      if (!isBackground) setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status, session]);

  const value = useMemo<Ctx>(() => {
    const me = s.resellers.find(r => r.id === s.currentResellerId) ?? {
      id: "", name: "", brandName: "Guest", phone: "", balance: 0, brandLogo: "",
      pendingBalance: 0, codReserve: 0, totalWithdrawn: 0,
      isLocked: false, totalOrdersPlaced: 0, totalOrdersFailed: 0,
      shopifyConnected: false, shopifyDomain: null,
      email: null, storeAddress: null, supportEmail: null, createdAt: new Date(), shopifyToken: null
    };
    const meVendor = s.vendors.find(v => v.id === s.currentVendorId) ?? {
      id: "", name: "", brandName: "Guest", phone: "", bankName: "",
      email: null, ownerName: null, cnicNumber: null, businessAddress: null,
      pickupPersonName: null, pickupPhone: null, pickupAddress: null,
      pickupCity: null, pickupArea: null, postalCode: null,
      returnAddress: null, returnCity: null, returnContact: null, returnPhone: null,
      accountName: "", accountNumber: "", iban: null, balance: 0, pendingBalance: 0, totalWithdrawn: 0,
      brandLogo: "", approvalStatus: "Pending", kycStatus: "Pending",
    };

    return {
      s, me, meVendor,
      locked: me.balance <= -(s.config?.codReserveAmount ?? 500),
      isDataLoading,
      refreshData: loadData,

      setRole: (role) => set(st => ({ ...st, role })),
      setCurrentReseller: (id) => set(st => ({ ...st, currentResellerId: id })),
      setCurrentVendor: (id) => set(st => ({ ...st, currentVendorId: id })),
      updateBrand: async (patch) => {
        try {
          await updateResellerProfileAction(patch);
          await loadData();
          toast.success("Brand updated successfully");
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      updateVendorProfile: async () => { toast.info("Profile update — use profile API in production"); },
      addCategory: () => {},
      deleteCategory: () => {},
      saveProduct: () => {},
      deleteProduct: async (id: string) => {
        try {
          const { adminDeleteProduct } = await import("@/actions/vendorProduct");
          await adminDeleteProduct(id);
          await loadData();
          toast.success("Product deleted successfully");
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      submitVendorProduct: async (data) => {
        try {
          // Convert array inputs to JSON strings for the server action
          const payload = {
            ...data,
            images: JSON.stringify(data.images || []),
            colors: JSON.stringify(data.colors || []),
            sizes: JSON.stringify(data.sizes || []),
            colorPricing: data.colorPricing ? JSON.stringify(data.colorPricing) : undefined,
            sizePricing: data.sizePricing ? JSON.stringify(data.sizePricing) : undefined,
            colorImages: data.colorImages ? JSON.stringify(data.colorImages) : undefined,
          };
          const { submitVendorProduct: submitAction } = await import("@/actions/vendorProduct");
          await submitAction(payload);
          await loadData();
        } catch (e: any) {
          toast.error(e.message || "Failed to submit product");
          throw e; // Throw so the UI can handle loading state if needed
        }
      },
      approveVendorProduct: async (id) => {
        try {
          const { approveVendorProduct: approveAction } = await import("@/actions/vendorProduct");
          await approveAction(id);
          await loadData();
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      rejectVendorProduct: async (id) => {
        try {
          const { rejectVendorProduct: rejectAction } = await import("@/actions/vendorProduct");
          await rejectAction(id, "Does not meet our quality standards.");
          await loadData();
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      requestProductEdit: async (productId, data) => {
        try {
          await reqEdit(productId, data);
          await loadData();
          toast.success("Edit request submitted to admin");
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      requestProductDelete: async (productId) => {
        try {
          await reqDel(productId);
          await loadData();
          toast.success("Delete request submitted to admin");
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      approveProductAction: async (requestId) => {
        try {
          await appAction(requestId);
          await loadData();
          toast.success("Request approved successfully");
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      rejectProductAction: async (requestId, reason) => {
        try {
          await rejAction(requestId, reason);
          await loadData();
          toast.success("Request rejected");
        } catch (e: any) {
          toast.error(e.message);
        }
      },

      placeOrder: async (o) => {
        const order = await serverPlaceOrder(o);
        await loadData();
        toast.success(`Order ${order.id} placed successfully!`);
      },

      setStatus: async (id, status, note, trackingId, courier) => {
        await updateOrderStatus(id, status, note, trackingId, courier);
        await loadData();
        toast.success(`Order → ${status}`);
      },

      bookOrders: () => toast.info("Courier booking via API — configure courier in admin settings"),
      requestOrderEdit: async (id, edits) => {
        try {
          await requestOrderEditAction(id, edits);
          await loadData();
          toast.success("Edit request submitted for admin approval");
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      approveOrderEdit: async (id) => {
        try {
          await approveOrderEditAction(id);
          await loadData();
          toast.success("Edit approved and applied");
        } catch (e: any) {
          toast.error(e.message);
        }
      },
      rejectOrderEdit: async (id) => {
        try {
          await rejectOrderEditAction(id);
          await loadData();
          toast.success("Edit request rejected");
        } catch (e: any) {
          toast.error(e.message);
        }
      },

      // Kept for backward compatibility — admin manual credit is separate
      credit: () => toast.info("Use Admin → Wallet section to credit accounts"),

      simulateLock: async () => {
        const resellerId = me.id || "r1";
        await simulateLockState(resellerId);
        await loadData();
        toast.error("Account locked — 2 simulated RTO orders applied");
      },

      resetLock: async () => {
        const resellerId = me.id || "r1";
        await resetLockState(resellerId);
        await loadData();
        toast.success("Lock reset — account unlocked");
      },

      requestPayout: async (p) => {
        await requestWithdrawal(p.amount, p.method, p.accountName, p.accountNumber);
        await loadData();
        toast.success("Withdrawal request submitted");
      },

      markPaid: async (id, approve, paymentRef, adminNote) => {
        await approveWithdrawal(id, approve, paymentRef, adminNote);
        await loadData();
        toast.success(approve ? "Withdrawal approved & paid" : "Withdrawal rejected");
      },

      requestUnlock: async (trxId, receipt) => {
        const resellerId = me.id || "r1";
        await db_requestUnlock(resellerId, trxId, receipt);
        await loadData();
        toast.success("Unlock request submitted to Admin");
      },

      approveUnlock: async (id, approve, adminNote) => {
        await processUnlockRequest(id, approve, adminNote);
        await loadData();
        toast.success(approve ? "Account unlocked" : "Request rejected");
      },

      send: async (resellerId, from, text, attachmentUrl, attachmentType) => {
        await sendMessage(resellerId, from, text, attachmentUrl, attachmentType);
        await loadData();
      },

      markRead: async (resellerId, reader) => {
        await markMessagesRead(resellerId, reader);
        await loadData();
      },

      addNotification: () => {},
      markNotificationsRead: async (target) => {
        try {
          await markNotificationsReadAction(target);
          await loadData();
        } catch (e: any) {
          console.error("Failed to mark notifications read:", e.message);
        }
      },
      markSingleNotificationRead: async (id) => {
        try {
          await markSingleNotificationReadAction(id);
          await loadData();
        } catch (e: any) {
          console.error("Failed to mark single notification read:", e.message);
        }
      },
      updatePlatformLogo: () => {},
      login: () => { window.location.href = "/login"; return true; },
      logout: () => { signOut({ callbackUrl: "/login" }); },
      submitKyc: async (k: Omit<KycRequest, "id" | "status" | "date">) => {
        try {
          const res = await submitKycAction(k);
          if (res?.error) {
            toast.error(res.error);
            throw new Error(res.error);
          }
          toast.success("KYC submitted successfully");
          await loadData();
        } catch (e: any) {
          toast.error(e.message);
          throw e; // rethrow to component
        }
      },
      approveKyc: async (id: string) => {
        try {
          const { processKycAction } = await import("@/actions/kyc");
          await processKycAction(id, true, "Admin");
          await loadData();
        } catch (e: any) {
          toast.error(e.message);
          throw e;
        }
      },
      rejectKyc: async (id: string) => {
        try {
          const { processKycAction } = await import("@/actions/kyc");
          await processKycAction(id, false, "Admin");
          await loadData();
        } catch (e: any) {
          toast.error(e.message);
          throw e;
        }
      },
    };
  }, [s, status]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

// ── DB helper for requestUnlock (called from client via store) ───────────────
async function db_requestUnlock(resellerId: string, trxId: string, receipt: string) {
  const { default: action } = await import("@/actions/unlock");
  return action(resellerId, trxId, receipt);
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const PKR = (n: number) =>
  `PKR ${Math.abs(Math.round(n)).toLocaleString("en-PK")}`;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
