import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { fetchAppData } from "@/actions/appData";
import { placeOrder as serverPlaceOrder, updateOrderStatus, getOrderTimeline, simulateLockState, resetLockState } from "@/actions/orders";
import { requestWithdrawal, approveWithdrawal } from "@/actions/wallet";
import { sendMessage, markMessagesRead, markNotificationsReadAction } from "@/actions/messages";
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
  businessAddress: string | null; pickupAddress: string | null; pickupCity: string | null;
  pickupPhone: string | null; returnAddress: string | null; returnCity: string | null;
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
};

const emptyState: State = {
  role: "guest", currentUser: null, config: null,
  categories: [], products: [], resellers: [], vendors: [],
  currentResellerId: "", currentVendorId: "",
  orders: [], ledger: [], payouts: [],
  unlocks: [], messages: [], notifications: [], kycRequests: [],
};

type Ctx = {
  s: State;
  setRole: (r: Role) => void;
  me: Reseller;
  meVendor: Vendor;
  locked: boolean;
  setCurrentReseller: (id: string) => void;
  setCurrentVendor: (id: string) => void;
  updateBrand: (patch: Partial<Reseller>) => void;
  updateVendorProfile: (patch: Partial<Vendor>) => void;
  addCategory: (title: string, image: string) => void;
  deleteCategory: (id: string) => void;
  saveProduct: (p: any) => void;
  deleteProduct: (id: string) => void;
  submitVendorProduct: (p: any) => void;
  approveVendorProduct: (productId: string) => void;
  rejectVendorProduct: (productId: string) => void;
  placeOrder: (o: any) => Promise<void>;
  setStatus: (id: string, status: string, note?: string, trackingId?: string, courier?: string) => Promise<void>;
  bookOrders: (orderIds: string[], courier: string) => void;
  requestOrderEdit: (id: string, edits: Partial<Order>) => void;
  approveOrderEdit: (id: string) => void;
  rejectOrderEdit: (id: string) => void;
  requestPayout: (p: any) => Promise<void>;
  markPaid: (id: string, approve: boolean, paymentRef?: string, adminNote?: string) => Promise<void>;
  requestUnlock: (trxId: string, receipt: string) => Promise<void>;
  approveUnlock: (id: string, approve: boolean, adminNote?: string) => Promise<void>;
  send: (resellerId: string, from: any, text: string, attachmentUrl?: string, attachmentType?: any) => Promise<void>;
  markRead: (resellerId: string, reader: "admin" | "reseller") => Promise<void>;
  addNotification: (target: string, title: string, message: string) => void;
  markNotificationsRead: (target: string) => void;
  updatePlatformLogo: (url: string) => void;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  submitKyc: (k: any) => void;
  approveKyc: (id: string) => void;
  rejectKyc: (id: string) => void;
  refreshData: () => Promise<void>;
  credit: (resellerId: string, amount: number, label: string, tag: string, proof?: string) => void;
  simulateLock: () => Promise<void>;
  resetLock: () => Promise<void>;
  isDataLoading: boolean;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(emptyState);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { data: session, status } = useSession();

  const loadData = async () => {
    if (status === "loading") return;
    setIsDataLoading(true);
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
        currentResellerId: data.state.me?.id || (data.state.resellers?.[0]?.id ?? ""),
        currentVendorId: data.state.meVendor?.id || (data.state.vendors?.[0]?.id ?? ""),
      }));
    } catch (e: any) {
      console.error("fetchAppData error:", e.message);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [status, session]);

  const value = useMemo<Ctx>(() => {
    const me = s.resellers.find(r => r.id === s.currentResellerId) ?? {
      id: "", name: "", brandName: "Guest", phone: "", balance: 0, brandLogo: "",
      pendingBalance: 0, codReserve: 0, totalWithdrawn: 0,
      isLocked: false, totalOrdersPlaced: 0, totalOrdersFailed: 0,
      shopifyConnected: false, shopifyDomain: null,
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
      updateVendorProfile: () => toast.info("Profile update — use profile API in production"),
      addCategory: () => {},
      deleteCategory: () => {},
      saveProduct: () => {},
      deleteProduct: () => {},
      submitVendorProduct: () => {},
      approveVendorProduct: () => {},
      rejectVendorProduct: () => {},

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
