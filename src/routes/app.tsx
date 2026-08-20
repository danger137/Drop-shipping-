'use client';

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Download, Lock, Wallet, PackageCheck, Truck, RotateCcw, ShoppingCart, Image as ImageIcon,
  MessageCircle, Settings, Paperclip, Mic, ShoppingBag, ExternalLink, CheckCircle, XCircle, Clock, Eye, Package,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, PKR, fileToDataUrl, type Order } from "@/lib/store";
import { PK_CITIES, type Product } from "@/lib/seed";
import {
  connectShopifyStore, disconnectShopifyStore, getShopifyStatus, pushProductToShopify, syncShopifyOrders,
} from "@/actions/shopify";


import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* ─── Support hours helper ─── */
function isSupportOpen() {
  // Pakistan Standard Time (UTC+5)
  const now = new Date();
  const pkt = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const h = pkt.getHours();
  return h >= 12 && h < 17; // 12:00 PM – 5:00 PM
}


function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Wallet; tone?: string }) {
  return (
    <div className="border border-border bg-background p-5 card-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className={`mt-2 text-2xl font-black ${tone ?? "text-charcoal"}`}>{value}</p>
    </div>
  );
}

export default function ResellerPanel() {
  const store = useStore();
  const { s, me, locked, isDataLoading } = store;
  const [tab, setTab] = useState("dashboard");
  const [product, setProduct] = useState<Product | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [proofView, setProofView] = useState<string | null>(null);

  const { status } = useSession();

  const myOrders = s.orders.filter((o) => o.resellerId === me.id);
  const myLedger = s.ledger.filter((l) => l.resellerId === me.id);
  const netProfit = myLedger.filter((l) => l.tag === "Profit").reduce((a, b) => a + b.amount, 0);

  const router = useRouter();
  useEffect(() => {
    if (status !== "loading" && !isDataLoading) {
      if (s.role === "pending") {
        router.push("/pending");
      } else if (s.role === "guest") {
        router.push("/login");
      }
    }
  }, [s.role, router, status, isDataLoading]);

  if (status === "loading" || isDataLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F9F9FC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (s.role === "pending") return null;

  if (s.role === "guest") {
    return null;
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: ShoppingCart },
    { id: "catalog", label: "Product Catalog", icon: ImageIcon },
    { id: "orders", label: `My Orders (${myOrders.length})`, icon: PackageCheck },
    { id: "wallet", label: "Wallet & Payouts", icon: Wallet },
    { id: "shopify", label: "Shopify Store", icon: ShoppingBag },
    { id: "chat", label: "Support Chat", icon: MessageCircle },
    { id: "settings", label: "Brand Settings", icon: Settings },
  ];

  return (
    <DashboardLayout
      title="Reseller Portal"
      role="reseller"
      items={sidebarItems}
      activeItem={tab}
      onItemChange={setTab}
    >
      {/* ─── Dashboard Hero Banner ─────────────────────── */}
      <div
        className="relative mb-6 rounded-3xl overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1400&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 bg-charcoal/85" />

        <div className="relative z-10 px-6 pt-8 pb-6 md:px-10 md:pt-10">
          {/* user greeting */}
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Welcome back</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-black text-white">{me.brandName} 👋</h2>



          {/* stat cards */}
          <div className={`mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 ${locked ? "lg:grid-cols-3" : ""}`}>
            <div className=" bg-white p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Earnings (Net Profit)</p>
                <p className="text-3xl font-black text-primary mt-1">{PKR(netProfit)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="bg-white p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wallet Balance</p>
                <p className={`text-3xl font-black mt-1 ${me.balance < 0 ? "text-destructive" : "text-charcoal"}`}>{PKR(me.balance)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-charcoal/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-charcoal" />
              </div>
            </div>
            
            {locked && (
              <div 
                className="bg-red-600 p-5 flex items-center justify-between shadow-lg cursor-pointer hover:bg-red-700 transition-colors border-2 border-red-700" 
                onClick={() => setLockOpen(true)}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70">Account Locked</p>
                  <p className="text-xl font-black text-white mt-1 leading-tight">Add Rs. 500 Security</p>
                  <p className="text-[11px] text-white/60 mt-1">Tap to submit payment & unlock</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/30">
                  <Lock className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Balance-lock banner */}
      {locked && !me.isLocked && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">
            Your wallet is {PKR(me.balance)}. Order placement is blocked until you top up PKR 500.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setLockOpen(true)}>
            Request Account Unlock
          </Button>
        </div>
      )}

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total Orders" value={String(myOrders.length)} icon={ShoppingCart} />
            <Metric label="Dispatched" value={String(myOrders.filter((o) => o.status === "Dispatched").length)} icon={Truck} />
            <Metric label="Delivered" value={String(myOrders.filter((o) => o.status === "Delivered").length)} icon={PackageCheck} />
            <Metric label="Returned (RTO)" value={String(myOrders.filter((o) => o.status === "Returned").length)} icon={RotateCcw} />
          </div>
          <OrdersTable orders={myOrders} />
        </div>
      )}

      {tab === "catalog" && (
        <div>
          {product ? (
            <ProductDetail product={product} onBack={() => setProduct(null)} locked={locked} />
          ) : (
            <Catalog onOpen={setProduct} />
          )}
        </div>
      )}

      {tab === "orders" && <OrdersTable orders={myOrders} />}

      {tab === "wallet" && <WalletTab netProfit={me.balance} onViewProof={setProofView} />}

      {tab === "shopify" && <ShopifyTab />}

      {tab === "chat" && <ResellerChat />}

      {tab === "settings" && <BrandSettings />}

      <LockModal open={lockOpen} onOpenChange={setLockOpen} />
      <Dialog open={!!proofView} onOpenChange={() => setProofView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment proof</DialogTitle></DialogHeader>
          {proofView && <img src={proofView} alt="Payment proof" className="w-full rounded-xl" />}
          {proofView && (
            <a href={proofView} download="payment-proof.png">
              <Button className="w-full gap-2"><Download className="h-4 w-4" /> Download proof</Button>
            </a>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ResellerChat() {
  const { s, me, send } = useStore();
  const [text, setText] = useState("");
  const [supportOpen, setSupportOpen] = useState(isSupportOpen());
  const msgs = s.messages.filter((m) => m.resellerId === me.id);

  // Re-check support hours every minute
  useEffect(() => {
    const interval = setInterval(() => setSupportOpen(isSupportOpen()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-border/60 p-6 card-shadow flex flex-col h-[580px]">
      <div className="border-b border-[#F4F3F6] pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-charcoal">Support Chat</h3>
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
            supportOpen ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-muted text-muted-foreground border border-border"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${supportOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            {supportOpen ? "Online" : "Offline"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {supportOpen
            ? "We're online! Chat directly with the Owner Admin."
            : "Support hours: 12:00 PM – 5:00 PM (Pakistan Time). You can still read previous messages."}
        </p>
      </div>

      {/* Offline notice banner */}
      {!supportOpen && (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <p className="font-bold">Support is currently closed.</p>
            <p>Business hours: 12:00 PM – 5:00 PM (Mon–Sat). Your message will be answered when support opens.</p>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-[#F9F9FC] rounded-2xl mb-4">
        {msgs.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No messages yet. Say Assalam-o-Alaikum to start!
          </div>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.from === "reseller"
              ? "ml-auto bg-primary text-primary-foreground"
              : "bg-white text-charcoal border border-[#EBEAED]"
              }`}
          >
            {m.text && <p className="break-words">{m.text}</p>}
            {m.attachmentType === 'image' && m.attachmentUrl && <img src={m.attachmentUrl} className="mt-2 rounded-xl max-w-full h-auto max-h-48 object-cover shadow-sm border border-black/10" alt="Attached" />}
            {m.attachmentType === 'audio' && m.attachmentUrl && <audio src={m.attachmentUrl} controls className="mt-2 w-full max-w-[200px] h-8" />}
            {m.attachmentType === 'pdf' && m.attachmentUrl && <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-1 block font-bold">📄 View PDF Document</a>}
            <span className="block text-[9px] opacity-70 mt-1 text-right">
              {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      <form
        className="flex items-center gap-2 sm:gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!supportOpen) { toast.error("Support is offline. Hours: 12 PM – 5 PM (PKT)"); return; }
          if (!text.trim()) return;
          send(me.id, "reseller", text.trim());
          setText("");
        }}
      >
        <label className={`cursor-pointer shrink-0 ${!supportOpen ? "opacity-40 pointer-events-none" : ""}`}>
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={async (e) => {
            if (!supportOpen) return;
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await fileToDataUrl(f);
            const type = f.type.includes("pdf") ? "pdf" : "image";
            send(me.id, "reseller", "", url, type);
          }} />
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#F9F9FC] hover:bg-[#EBEAED] text-muted-foreground transition-colors">
            <Paperclip className="h-5 w-5" />
          </div>
        </label>
        <Input
          className="rounded-xl border-[#EBEAED] py-5 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={supportOpen ? "Type a message…" : "Support closed — opens at 12 PM"}
          disabled={!supportOpen}
        />
        <Button
          className="rounded-xl px-5"
          type="submit"
          disabled={!supportOpen}
        >Send</Button>
      </form>
    </div>
  );
}

function StatusBadge({ st }: { st: Order["status"] }) {
  const map: Record<Order["status"], string> = {
    Pending: "bg-muted text-muted-foreground",
    READY_FOR_PICKUP: "bg-orange-100 text-orange-700 border border-orange-200",
    Dispatched: "bg-blue-100 text-blue-700 border border-blue-200",
    Delivered: "bg-primary text-primary-foreground",
    Returned: "bg-destructive text-destructive-foreground",
  };
  const label = st === "READY_FOR_PICKUP" ? "Ready for Pickup" : st;
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${map[st]}`}>{label}</span>;
}

function OrdersTable({ orders }: { orders: Order[] }) {
  const { requestOrderEdit } = useStore();
  const [edit, setEdit] = useState<Order | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [ef, setEf] = useState({ customerName: "", phone1: "", city: "", address: "", variant: "" });

  const handleEditSubmit = () => {
    if (!edit) return;
    requestOrderEdit(edit.id, ef);
    toast.success("Edit request submitted for approval");
    setEdit(null);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background card-shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>City</TableHead>
            <TableHead>COD</TableHead>
            <TableHead>Profit</TableHead>
            <TableHead>Tracking Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No orders yet.</TableCell></TableRow>
          )}
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-semibold text-xs align-top">{o.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {o.image && (
                    <img
                      src={o.image}
                      alt={o.productTitle}
                      className="h-12 w-12 rounded-xl object-cover border border-border shrink-0 shadow-sm"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal truncate max-w-[10rem]">{o.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{o.variant}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{o.customerName}<span className="block text-xs text-muted-foreground">{o.phone1}</span></TableCell>
              <TableCell>{o.city}</TableCell>
              <TableCell className="font-semibold">{PKR(o.collect)}</TableCell>
              <TableCell className="font-semibold text-primary">{PKR(o.profit)}</TableCell>
              <TableCell>
                {o.trackingId ? (
                  <div className="space-y-0.5">
                    {o.courier && (
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase">{o.courier}</span>
                    )}
                    <a
                      href={`https://postex.pk/tracking/${o.trackingId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                    >
                      {o.trackingId} ↗
                    </a>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    Pending Dispatch
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 items-start">
                  <StatusBadge st={o.status} />
                  {o.editStatus === "Pending" && <Badge variant="outline" className="text-[9px] border-orange-300 text-orange-600 bg-orange-50">⚠️ Edit Pending</Badge>}
                  {o.editStatus === "Approved" && <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-600 bg-emerald-50">✓ Edit Approved</Badge>}
                  {o.editStatus === "Rejected" && <Badge variant="outline" className="text-[9px] border-red-300 text-red-600 bg-red-50">✗ Edit Rejected</Badge>}
                  
                  {o.status === "Pending" && o.editStatus !== "Pending" && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary" onClick={() => {
                      setEdit(o);
                      setEf({ customerName: o.customerName, phone1: o.phone1, city: o.city, address: o.address, variant: o.variant });
                    }}>
                      ✎ Edit Details
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-2 shrink-0" onClick={() => setViewOrder(o)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Order Details Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-charcoal flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Order Details
            </DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-6">
              <div className="flex gap-4 p-4 border border-border bg-surface rounded-xl">
                {viewOrder.image && <img src={viewOrder.image} className="h-20 w-20 object-cover rounded-lg border border-border shrink-0 shadow-sm" />}
                <div>
                  <h3 className="font-bold text-charcoal">{viewOrder.productTitle}</h3>
                  <p className="text-sm text-muted-foreground">{viewOrder.variant}</p>
                  <div className="mt-2 text-xs font-bold bg-white border border-border px-2 py-1 rounded w-fit text-primary">COD: {PKR(viewOrder.collect)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-border bg-surface rounded-xl">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Customer</h4>
                  <p className="font-medium text-sm text-charcoal">{viewOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{viewOrder.phone1}</p>
                </div>
                <div className="p-4 border border-border bg-surface rounded-xl">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Delivery</h4>
                  <p className="font-medium text-sm text-charcoal">{viewOrder.city}</p>
                  <p className="text-sm text-muted-foreground">{viewOrder.address}</p>
                </div>
              </div>

              <div className="p-4 border border-border bg-surface rounded-xl space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order ID</span><span className="font-medium">{viewOrder.id}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(viewOrder.date).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Courier</span><span className="font-medium uppercase">{viewOrder.courier ?? "Pending"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tracking ID</span><span className="font-mono">{viewOrder.trackingId ?? "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Profit</span><span className="font-bold text-primary">{PKR(viewOrder.profit)}</span></div>
              </div>

              <div className="p-4 border border-border bg-surface rounded-xl">
                <h4 className="text-xs font-bold text-charcoal mb-4 uppercase tracking-wider">Tracking Timeline</h4>
                <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-border">
                  {[
                    { st: "Pending", label: "Order Placed", done: true },
                    { st: "Confirmed", label: "Confirmed via Call", done: ["Confirmed", "Packed", "Shipped", "Delivered", "Settled"].includes(viewOrder.status) },
                    { st: "Packed", label: "Packed & Ready", done: ["Packed", "Shipped", "Delivered", "Settled"].includes(viewOrder.status) },
                    { st: "Shipped", label: "Picked by Courier", done: ["Shipped", "Delivered", "Settled"].includes(viewOrder.status) },
                    { st: "Delivered", label: "Delivered to Customer", done: ["Delivered", "Settled"].includes(viewOrder.status) },
                    { st: "Settled", label: "Profit Credited", done: ["Settled"].includes(viewOrder.status) },
                  ].map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[29px] h-4 w-4 rounded-full border-2 bg-white ${step.done ? 'border-primary' : 'border-border'}`}>
                        {step.done && <div className="absolute inset-[3px] rounded-full bg-primary" />}
                      </div>
                      <p className={`text-sm font-semibold ${step.done ? 'text-charcoal' : 'text-muted-foreground'}`}>{step.label}</p>
                    </div>
                  ))}
                  {(viewOrder.status === "RTO" || viewOrder.status === "Returned" || viewOrder.status === "Cancelled") && (
                    <div className="relative mt-4">
                      <div className="absolute -left-[29px] h-4 w-4 rounded-full border-2 border-destructive bg-white">
                        <div className="absolute inset-[3px] rounded-full bg-destructive" />
                      </div>
                      <p className="text-sm font-bold text-destructive">Order {viewOrder.status}</p>
                    </div>
                  )}
                </div>
              </div>

              {viewOrder.status === "Pending" && (Date.now() - new Date(viewOrder.date).getTime() < 3600000) ? (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                  <p className="text-xs text-orange-800">You can cancel this order within 1 hour of placing it. After that, please contact support.</p>
                  <Button variant="destructive" className="w-full" onClick={() => {
                    requestOrderEdit(viewOrder.id, { status: "Cancelled" });
                    toast.success("Cancellation requested");
                    setViewOrder(null);
                  }}>
                    Cancel Order
                  </Button>
                </div>
              ) : (viewOrder.status === "Pending" || viewOrder.status === "Confirmed") ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <p className="text-xs text-blue-800 font-medium">To cancel or modify this order, please message Support Chat.</p>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Order Edit</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Changes must be approved by the admin/vendor.</p>
            <div><Label>Customer Name</Label><Input value={ef.customerName} onChange={e => setEf({ ...ef, customerName: e.target.value })} /></div>
            <div><Label>Phone 1</Label><Input value={ef.phone1} onChange={e => setEf({ ...ef, phone1: e.target.value })} /></div>
            <div>
              <Label>City</Label>
              <Select value={ef.city} onValueChange={(v) => setEf({ ...ef, city: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PK_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Address</Label><Textarea value={ef.address} onChange={e => setEf({ ...ef, address: e.target.value })} /></div>
            <div><Label>Variant (Color/Size)</Label><Input value={ef.variant} onChange={e => setEf({ ...ef, variant: e.target.value })} /></div>
            <Button className="w-full mt-2" onClick={handleEditSubmit}>Submit Edit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Catalog({ onOpen }: { onOpen: (p: Product) => void }) {
  const { s } = useStore();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const list = useMemo(
    () =>
      s.products.filter(
        (p) =>
          (cat === "all" || p.categoryId === cat) &&
          p.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [s.products, cat, q],
  );

  const activeCategory = cat === "all" ? "All Products" : (s.categories.find(c => c.id === cat)?.title ?? "");

  return (
    <div className="relative pb-24">
      {/* Top Search Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
          <Input className="pl-9 bg-background" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="text-sm font-semibold text-muted-foreground bg-surface border border-border/60 rounded-xl px-3 py-2">
          <span className="text-primary font-black">{list.length}</span> products in <span className="text-charcoal">{activeCategory}</span>
        </span>
      </div>

      {/* Product Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-charcoal">No products found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          list.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="group overflow-hidden rounded-2xl border border-border bg-background text-left card-shadow transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="relative overflow-hidden h-44">
                <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {p.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-xs bg-destructive px-3 py-1.5 rounded-full">Out of Stock</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur text-[10px] font-bold text-primary px-2 py-1 rounded-full shadow-sm">
                    {s.categories.find(c => c.id === p.categoryId)?.title ?? "General"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-charcoal truncate group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{p.hook}</p>
                {/* Color/Size variant chips */}
                {(p.colors.length > 0 || p.sizes.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.colors.slice(0, 4).map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-lg bg-primary/8 text-[9px] font-bold text-primary border border-primary/20">
                        {c}{p.colorPricing?.[c] ? ` · ${PKR(p.colorPricing![c])}` : ""}
                      </span>
                    ))}
                    {p.sizes.slice(0, 4).map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-lg bg-surface text-[9px] font-bold text-charcoal border border-border">
                        {s}{p.sizePricing?.[s] ? ` · ${PKR(p.sizePricing![s])}` : ""}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Wholesale</p>
                    <p className="text-xl font-black text-primary leading-tight">{PKR(p.wholesale)}</p>
                    <p className="text-[10px] text-muted-foreground">Sell at {PKR(p.suggested)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Est. Profit</p>
                    <p className="text-sm font-black text-emerald-600">+{PKR(p.suggested - p.wholesale - 250)}</p>
                  </div>
                </div>
                {p.stock > 0 && (
                  <p className="mt-2 text-[11px] font-semibold text-primary/80">✓ In stock · {p.stock} units</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Sticky Bottom Category Pill Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-3xl">
        <div className="bg-white/90 backdrop-blur-xl border border-[#EBEAED] rounded-2xl shadow-2xl shadow-black/10 px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setCat("all")}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${cat === "all"
                ? "bg-[#1A1A1A] text-white shadow-md"
                : "bg-surface text-muted-foreground hover:bg-[#EBEAED] hover:text-charcoal"
                }`}
            >
              All
            </button>
            {s.categories.map((c) => {
              const count = s.products.filter(p => p.categoryId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${cat === c.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface text-muted-foreground hover:bg-[#EBEAED] hover:text-charcoal"
                    }`}
                >
                  {c.title}
                  <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 ${cat === c.id ? "bg-white/20 text-white" : "bg-border text-muted-foreground"
                    }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, onBack, locked }: { product: Product; onBack: () => void; locked: boolean }) {
  const { me, placeOrder } = useStore();
  const [img, setImg] = useState(product.images[0]);
  const [color, setColor] = useState<string>(product.colors[0] ?? "");
  const [size, setSize] = useState<string>(product.sizes[0] ?? "");
  const [collect, setCollect] = useState<number | "">(product.suggested);
  const [form, setForm] = useState({ customerName: "", phone1: "", phone2: "", city: "Lahore", address: "" });
  const [courier, setCourier] = useState("Trax");
  const [showProfitAnim, setShowProfitAnim] = useState(false);
  const [prevCollect, setPrevCollect] = useState<number | "">(product.suggested);

  // Effective wholesale: check per-variant pricing first, then fall back to base
  const effectiveWholesale = (
    (product.colors.length > 0 && color && product.colorPricing?.[color])
      ? product.colorPricing![color]
      : (product.sizes.length > 0 && size && product.sizePricing?.[size])
        ? product.sizePricing![size]
        : product.wholesale
  );

  const collectNum = collect === "" ? 0 : Number(collect);
  const courierRates: Record<string, number> = {
    "Trax": 200,
    "PostEx": 220,
    "Leopards": 250,
  };
  const deliveryFee = courierRates[courier] || 250;
  const profit = collectNum - effectiveWholesale - deliveryFee;
  const profitPositive = profit > 0;

  // Build variant string from only non-empty parts
  const variantParts = [
    product.colors.length > 0 ? color : null,
    product.sizes.length > 0 ? size : null,
  ].filter(Boolean);
  const variantStr = variantParts.length > 0 ? variantParts.join(" / ") : "Standard";

  // When color/size changes, update collect to reflect new suggested if no custom collect yet
  const hasColorPricing = product.colors.length > 0 && Object.keys(product.colorPricing ?? {}).length > 0;
  const hasSizePricing = product.sizes.length > 0 && Object.keys(product.sizePricing ?? {}).length > 0;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={onBack}>← Back to catalog</Button>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: Images + marketing copy */}
        <div className="space-y-4">
          <div className="border border-border bg-background p-4 card-shadow">
            <img src={img} alt={product.title} className="h-80 w-full object-cover" />
            <div className="mt-3 flex gap-3">
              {product.images.map((i) => (
                <button key={i} onClick={() => setImg(i)}>
                  <img src={i} alt="" className={`h-16 w-16 object-cover ${i === img ? "ring-2 ring-primary" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Download + TikTok/FB copy */}
          <Button
            className="w-full gap-2"
            onClick={() => toast.success("Asset pack ready: 3 images, TikTok hook + Facebook ad copy downloaded")}
          >
            <Download className="h-4 w-4" /> 1-Click Asset Download
          </Button>

          {/* Title + Description BELOW Download button */}
          <div className="border border-border bg-background p-5 card-shadow">
            <h2 className="text-2xl font-black text-charcoal">{product.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <div className="bg-surface p-4 text-sm border border-border">
            <p className="font-semibold text-charcoal">TikTok hook</p>
            <p className="mt-1 text-muted-foreground">{product.hook}</p>
            <p className="mt-3 font-semibold text-charcoal">Facebook ad copy</p>
            <p className="mt-1 text-muted-foreground">
              🔥 {product.title} — Cash on Delivery all over Pakistan. Order now, pay when you receive!
            </p>
          </div>
        </div>

        {/* RIGHT: Pricing info + Order form */}
        <div className="space-y-4">
          <div className="border border-border bg-background p-5 card-shadow">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-surface p-3">
                <p className="text-xs text-muted-foreground">Wholesale</p>
                <p className="font-black text-primary">{PKR(effectiveWholesale)}</p>
                {effectiveWholesale !== product.wholesale && (
                  <p className="text-[10px] text-muted-foreground line-through">{PKR(product.wholesale)}</p>
                )}
              </div>
              <div className="bg-surface p-3"><p className="text-xs text-muted-foreground">Suggested</p><p className="font-black text-charcoal">{PKR(product.suggested)}</p></div>
              <div className="bg-surface p-3"><p className="text-xs text-muted-foreground">Stock</p><p className="font-black text-charcoal">{product.stock}</p></div>
            </div>
          </div>

          <form
            className="space-y-4 border border-border bg-background p-6 card-shadow"
            onSubmit={(e) => {
              e.preventDefault();
              if (locked) { 
                toast.error("Account locked — Add Rs. 500 security deposit to place orders.", {
                  description: "Your wallet balance is negative. Submit Rs. 500 security payment to unlock your account.",
                  action: { label: "Submit Payment", onClick: () => setLockOpen(true) },
                  duration: 6000,
                });
                return;
              }
              if (!form.customerName || !form.phone1 || !form.address) { toast.error("Fill customer name, phone and address"); return; }
              placeOrder({
                resellerId: me.id, productId: product.id, productTitle: product.title, image: product.images[0],
                variant: variantStr, ...form, collect: collectNum, wholesale: effectiveWholesale,
                courier, deliveryFee
              });
              toast.success("Order placed — we will dispatch within 24 hours");
              onBack();
            }}
          >
            <h3 className="text-lg font-bold text-charcoal">Place COD Order</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Customer Name</Label><Input className="rounded-none" placeholder="e.g. Ali Hassan" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
              <div><Label>Customer Phone</Label><Input className="rounded-none" placeholder="e.g. 0300-1234567" value={form.phone1} onChange={(e) => setForm({ ...form, phone1: e.target.value })} /></div>
              <div><Label>Phone 2 (optional)</Label><Input className="rounded-none" placeholder="optional" value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} /></div>
              <div>
                <Label>City</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{PK_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {product.colors.length > 0 && (
                <div className="sm:col-span-2">
                  <Label className="mb-2 block font-bold text-black">Color {hasColorPricing && <span className="text-[10px] text-black font-semibold ml-1">(Price Varies Per Color)</span>}</Label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => {
                      const isSelected = color === c;
                      const varPrice = product.colorPricing?.[c];
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setColor(c);
                            // Switch main image to per-color image if set
                            if (product.colorImages?.[c]) setImg(product.colorImages[c]);
                          }}
                          className={`px-5 py-1 rounded-none uppercase border-2 font-[600] text-sm transition-all duration-200 ${isSelected
                            ? "border-primary bg-primary text-white shadow-md scale-[1.02]"
                            : "border-border bg-surface text-charcoal hover:border-primary/50"
                            }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div className="sm:col-span-2">

                  <Label className="mb-2 block font-bold text-black">Size {hasSizePricing && <span className="text-[10px] text-black font-semibold ml-1">(price varies per size)</span>}</Label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((sz) => {
                      const isSelected = size === sz;
                      const varPrice = product.sizePricing?.[sz];
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSize(sz)}
                          className={`px-6 py-1 rounded-none uppercase border-2 font-bold text-sm transition-all duration-200 ${isSelected
                            ? "border-primary bg-primary text-white shadow-md scale-[1.02]"
                            : "border-border bg-surface text-charcoal hover:border-primary/50"
                            }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div><Label>Customer Full Address</Label><Textarea className="rounded-none" placeholder="e.g. House 12, Street 5, Model Town, Lahore" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>

            {/* Courier Selection */}
            <div>
              <Label className="mb-2 block font-bold text-black">Select Courier & Rate</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(courierRates).map(([c, rate]) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCourier(c)}
                    className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                      courier === c 
                        ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm' 
                        : 'border-border bg-surface text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <span className="font-bold text-sm">{c}</span>
                    <span className="text-xs">PKR {rate}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* COD Amount input with profit calculator */}
            <div className="space-y-3">
              <Label>Amount to Collect from Customer (COD)</Label>
              <Input
                type="number"
                className="rounded-none text-lg font-bold h-12"
                placeholder={`Suggested: ${product.suggested}`}
                value={collect === 0 ? "" : collect}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setCollect(val as number | "");
                  if (val !== "" && Number(val) > effectiveWholesale + deliveryFee) {
                    setShowProfitAnim(true);
                  } else {
                    setShowProfitAnim(false);
                  }
                }}
              />

              {/* Profit Reveal Animation - stays as long as profit is positive */}
              {showProfitAnim && profitPositive && (
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <span className="text-4xl shrink-0">🎉</span>
                  <div>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Congratulations! Your Profit</p>
                    <p className="text-4xl font-black text-white leading-none mt-1">{PKR(profit)}</p>
                    <p className="text-xs text-white/70 mt-1">per order after wholesale + delivery</p>
                  </div>
                  <span className="text-4xl shrink-0 ml-auto">💰</span>
                </div>
              )}

              {/* Profit Breakdown */}
              <div className="bg-charcoal p-4 text-sm text-white">
                <div className="flex justify-between"><span className="opacity-70">Collected from customer</span><span>{PKR(collectNum)}</span></div>
                <div className="flex justify-between">
                  <span className="opacity-70">Wholesale cost {effectiveWholesale !== product.wholesale ? `(${variantStr})` : ""}</span>
                  <span>-{PKR(effectiveWholesale)}</span>
                </div>
                <div className="flex justify-between"><span className="opacity-70">Delivery fee ({courier})</span><span>-{PKR(deliveryFee)}</span></div>
                <div className="mt-2 flex justify-between border-t border-white/15 pt-2 text-base font-black">
                  <span>Your Net Profit</span><span className={profit < 0 ? "text-red-400" : "text-primary"}>{PKR(profit)}</span>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={locked}>
              {locked ? "Locked — top up to order" : "Confirm Order"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function WalletTab({ netProfit, onViewProof }: { netProfit: number; onViewProof: (u: string) => void }) {
  const { s, me, requestPayout } = useStore();
  const ledger = s.ledger.filter((l) => l.resellerId === me.id);
  const payouts = s.payouts.filter((p) => p.resellerId === me.id);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ amount: 1500, method: "EasyPaisa", accountName: me.name, accountNumber: "" });
  const canWithdraw = netProfit >= 1500;

  const totalEarnings = ledger.filter(l => l.amount > 0).reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Available Balance</p>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className={`mt-2 text-2xl font-black ${me.balance < 0 ? "text-destructive" : "text-primary"}`}>{PKR(me.balance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Pending Settlement</p>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{PKR(me.pendingBalance ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Orders in transit</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Earnings</p>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{PKR(totalEarnings)}</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime profits settled</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Withdrawn</p>
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-black text-charcoal">{PKR(me.totalWithdrawn ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime payouts</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
        <Button className="w-full" disabled={!canWithdraw} onClick={() => setOpen(true)}>
          {canWithdraw ? "Request Profit Withdrawal" : `Minimum withdrawal is ${PKR(1500)}`}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background card-shadow">
        <p className="p-4 font-bold text-charcoal">Wallet Ledger</p>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Tag</TableHead><TableHead>Amount</TableHead><TableHead>Proof</TableHead></TableRow></TableHeader>
          <TableBody>
            {ledger.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs">{new Date(l.date).toLocaleDateString()}</TableCell>
                <TableCell>{l.label}</TableCell>
                <TableCell><Badge variant="outline">{l.tag}</Badge></TableCell>
                <TableCell className={l.amount < 0 ? "font-semibold text-destructive" : "font-semibold text-primary"}>{PKR(l.amount)}</TableCell>
                <TableCell>
                  {l.proof ? (
                    <button onClick={() => onViewProof(l.proof!)} className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <ImageIcon className="h-3.5 w-3.5" /> View
                    </button>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background card-shadow">
        <p className="p-4 font-bold text-charcoal">Payout Requests</p>
        <Table>
          <TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Account</TableHead><TableHead>Status</TableHead><TableHead>Proof</TableHead></TableRow></TableHeader>
          <TableBody>
            {payouts.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No payout requests yet.</TableCell></TableRow>}
            {payouts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{PKR(p.amount)}</TableCell>
                <TableCell>{p.method}</TableCell>
                <TableCell>{p.accountName} · {p.accountNumber}</TableCell>
                <TableCell><Badge variant={p.status === "Paid" ? "default" : "outline"}>{p.status}</Badge></TableCell>
                <TableCell>{p.proof ? <button onClick={() => onViewProof(p.proof!)} className="text-xs font-semibold text-primary">View / Download</button> : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Profit Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount (min PKR 1,500)</Label><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} /></div>
            <div>
              <Label>Method</Label>
              <Select value={f.method} onValueChange={(v) => setF({ ...f, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["EasyPaisa", "JazzCash", "Bank Transfer"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Account Title</Label><Input value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value })} /></div>
            <div><Label>Account / IBAN Number</Label><Input value={f.accountNumber} onChange={(e) => setF({ ...f, accountNumber: e.target.value })} /></div>
            <Button
              className="w-full"
              onClick={() => {
                if (f.amount < 1500 || !f.accountNumber) { toast.error("Minimum PKR 1,500 and account number required"); return; }
                requestPayout(f);
                setOpen(false);
                toast.success("Payout request submitted to Owner Admin");
              }}
            >
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LockModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { requestUnlock } = useStore();
  const [trx, setTrx] = useState("");
  const [receipt, setReceipt] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-destructive">Account Locked — Top Up Required</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-surface p-4">
            <p className="font-bold text-charcoal">Send PKR 500 to:</p>
            <p className="mt-2">EasyPaisa: <strong>0300-1234567</strong> (PakDropship)</p>
            <p>JazzCash: <strong>0321-7654321</strong> (PakDropship)</p>
            <p>Meezan Bank: <strong>PK36MEZN0001234567890123</strong></p>
          </div>
          <div><Label>Transaction ID (TRX ID)</Label><Input value={trx} onChange={(e) => setTrx(e.target.value)} /></div>
          <div>
            <Label>Payment Receipt Screenshot</Label>
            <Input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setReceipt(await fileToDataUrl(file));
            }} />
            {receipt && <img src={receipt} alt="Receipt preview" className="mt-2 h-32 rounded-lg object-cover" />}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (!trx || !receipt) { toast.error("TRX ID and receipt screenshot are required"); return; }
              requestUnlock(trx, receipt);
              onOpenChange(false);
              toast.success("Unlock request sent to Owner Admin for approval");
            }}
          >
            Request Account Unlock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BrandSettings() {
  const { me, updateBrand } = useStore();
  const [name, setName] = useState(me.brandName);
  return (
    <div className="max-w-lg space-y-4 rounded-2xl border border-border bg-background p-6 card-shadow">
      <h3 className="text-lg font-bold text-charcoal">Brand Personalization</h3>
      <img src={me.brandLogo} alt={me.brandName} className="h-20 w-20 rounded-2xl object-cover" />
      <div>
        <Label>Brand Logo</Label>
        <Input type="file" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) { updateBrand({ brandLogo: await fileToDataUrl(file) }); toast.success("Brand logo updated"); }
        }} />
      </div>
      <div><Label>Brand Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <Button onClick={() => { updateBrand({ brandName: name }); toast.success("Brand name saved"); }}>Save Changes</Button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHOPIFY INTEGRATION TAB
══════════════════════════════════════════════ */
function ShopifyTab() {
  const { s } = useStore();
  const [loading, setLoading] = useState(false);
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState<{ connected: boolean; domain: string | null; mappings: any[] } | null>(null);
  const [pushedIds, setPushedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getShopifyStatus().then(setStatus).catch(() => {});
  }, []);

  const handleConnect = async () => {
    const d = domain.trim();
    if (!d) { toast.error("Enter your Shopify store URL"); return; }
    setLoading(true);
    try {
      await connectShopifyStore(d, "mock-access-token-dev");
      const fresh = await getShopifyStatus();
      setStatus(fresh);
      toast.success(`✓ Shopify store "${d}" connected!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectShopifyStore();
      setStatus({ connected: false, domain: null, mappings: [] });
      toast.success("Shopify store disconnected.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async (productId: string) => {
    try {
      const res = await pushProductToShopify(productId);
      setPushedIds(prev => new Set([...prev, productId]));
      const fresh = await getShopifyStatus();
      setStatus(fresh);
      toast.success(`Product pushed to Shopify! ID: ${res.shopifyProductId}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSync = async () => {
    try {
      const res = await syncShopifyOrders();
      toast.success(res.message);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const mappedProductIds = new Set(status?.mappings?.map(m => m.productId) ?? []);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#96bf48]/10 to-[#5e8e3e]/10 border border-[#96bf48]/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-[#96bf48] flex items-center justify-center shadow-lg">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-charcoal">Shopify Integration</h2>
            <p className="text-xs text-muted-foreground">Connect your Shopify store to sync orders and push products</p>
          </div>
        </div>

        {status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold text-emerald-700">Connected: <strong>{status.domain}</strong></span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
                ↻ Sync Orders from Shopify
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={loading}>
                <XCircle className="h-4 w-4 mr-1" /> Disconnect Store
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-muted border border-border px-4 py-2.5">
              <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">No Shopify store connected yet</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="your-store.myshopify.com"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? "Connecting…" : "Connect Store"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 In production, you will be redirected to Shopify to authorize access. Your access token is stored securely on our server — never exposed to the browser.
            </p>
          </div>
        )}
      </div>

      {/* Products list to push */}
      {status?.connected && (
        <div className="rounded-3xl border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-charcoal">Push Products to Shopify</h3>
            <Badge variant="outline">{status.mappings?.length ?? 0} already pushed</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.products.map(p => {
              const isMapped = mappedProductIds.has(p.id) || pushedIds.has(p.id);
              return (
                <div key={p.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                  isMapped ? "border-emerald-200 bg-emerald-50" : "border-border bg-background hover:border-primary/40"
                }`}>
                  <img src={p.images[0]} alt={p.title} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{PKR(p.suggested)}</p>
                  </div>
                  {isMapped ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle className="h-4 w-4" /> Pushed
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => handlePush(p.id)}>
                      Push
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pushed product mappings table */}
      {status?.mappings && status.mappings.length > 0 && (
        <div className="rounded-3xl border border-border bg-background p-6">
          <h3 className="font-bold text-charcoal mb-4">Product Mappings</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PakDropship Product ID</TableHead>
                <TableHead>Shopify Product ID</TableHead>
                <TableHead>Pushed On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.mappings.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-mono">{m.productId}</TableCell>
                  <TableCell className="text-xs font-mono text-primary">{m.shopifyProductId}</TableCell>
                  <TableCell className="text-xs">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
