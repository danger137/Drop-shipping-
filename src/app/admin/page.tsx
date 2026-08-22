'use client';
import { useState, useMemo } from "react";
import {
  Send, Trash2, LayoutDashboard, ShoppingCart,
  FolderKanban, Package, KeyRound, WalletCards, Users,
  MessageSquareCode, TrendingUp, Search, Plus, ClipboardCheck, XCircle, CheckCircle2, Paperclip, Mic
} from "lucide-react";
import { toast } from "sonner";
import { useStore, PKR, fileToDataUrl, type OrderStatus } from "@/lib/store";
import { IMG, PHOTO_POOL, type Product } from "@/lib/seed";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardLayout } from "@/components/DashboardLayout";

import { ThermalLabel } from "@/components/ThermalLabel";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminPage() {
  return <AdminPanel />;
}

const STATUSES: OrderStatus[] = ["Pending", "READY_FOR_PICKUP", "Dispatched", "Delivered", "Returned"];

function AdminPanel() {
  const { s, setRole } = useStore();
  const [tab, setTab] = useState("dashboard");

  if (s.role !== "admin") {
    return (
      <div className="min-h-screen bg-surface">
        <SiteHeader />
        <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <img src="/logo.png" alt="PakDropship" className="h-20 w-20 object-contain" />
          <h1 className="mt-6 text-3xl font-black text-charcoal">Owner Access Only</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            You need Owner privileges to access this area. Click below to switch your role instantly in Dev mode.
          </p>
          <Button onClick={() => setRole("admin")} className="mt-6 rounded-none w-full shadow-lg">
            Unlock Admin Access
          </Button>
        </div>
      </div>
    );
  }

  const totalRevenue = s.orders.filter(o => o.status === "Delivered").reduce((acc, o) => acc + o.collect, 0);
  const pendingUnlocksCount = s.unlocks.filter(u => u.status === "Pending").length;
  const pendingPayoutsCount = s.payouts.filter(p => p.status === "Pending").length;
  const pendingKycCount = s.kycRequests.filter(k => k.status === "Pending").length;

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingCart, badge: s.orders.filter(o => o.status === "Pending").length },
    { id: "categories", label: "Categories", icon: FolderKanban },
    { id: "products", label: `Products (${s.products.length})`, icon: Package },
    { id: "registrations", label: "KYC Approvals", icon: ClipboardCheck, badge: pendingKycCount },
    { id: "unlocks", label: "Unlocks", icon: KeyRound, badge: pendingUnlocksCount },
    { id: "payouts", label: "Payouts", icon: WalletCards, badge: pendingPayoutsCount },
    { id: "users", label: "Resellers", icon: Users },
    { id: "chat", label: "Support Chat", icon: MessageSquareCode },
  ];

  return (
    <DashboardLayout
      title="Admin Dashboard"
      role="admin"
      items={sidebarItems}
      activeItem={tab}
      onItemChange={setTab}
    >
      {tab === "dashboard" && (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-charcoal tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor live metrics, inventory, financial payouts, and seller operations.</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Card 1: Delivered Revenue */}
            <div className="rounded-3xl border border-border/60 bg-white p-5 md:p-6 card-shadow">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <p className="mt-4 text-xl md:text-2xl font-black text-emerald-600">{PKR(totalRevenue)}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Delivered Revenue</p>
            </div>

            {/* Card 2: Total Orders */}
            <div className="rounded-3xl border border-border/60 bg-white p-5 md:p-6 card-shadow">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <p className="mt-4 text-xl md:text-2xl font-black text-charcoal">{s.orders.length}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Total Platform Orders</p>
            </div>

            {/* Card 3: Pending Unlocks */}
            <div className="rounded-3xl border border-border/60 bg-white p-5 md:p-6 card-shadow">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <KeyRound className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <p className="mt-4 text-xl md:text-2xl font-black text-charcoal">{s.unlocks.length}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Wallet Top-ups ({pendingUnlocksCount} pending)</p>
            </div>

            {/* Card 4: Payout slips */}
            <div className="rounded-3xl border border-border/60 bg-white p-5 md:p-6 card-shadow">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <WalletCards className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <p className="mt-4 text-xl md:text-2xl font-black text-charcoal">{s.payouts.length}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Payout Slips ({pendingPayoutsCount} due)</p>
            </div>
          </div>

          {/* Quick table / list on homepage */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-3xl border border-border/60 p-6 card-shadow">
              <h3 className="text-base font-bold text-charcoal mb-4">Recent Resellers</h3>
              <div className="space-y-3">
                {s.resellers.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between border-b border-[#F4F3F6] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <img src={r.brandLogo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-bold text-charcoal">{r.brandName}</p>
                        <p className="text-[10px] text-muted-foreground">{r.name} · {r.phone}</p>
                      </div>
                    </div>
                    <Badge variant={r.balance < 0 ? "destructive" : "secondary"} className="text-xs">
                      {PKR(r.balance)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/60 p-6 card-shadow">
              <h3 className="text-base font-bold text-charcoal mb-4">Recent Platform Orders</h3>
              <div className="space-y-3">
                {s.orders.slice(0, 5).map(o => (
                  <div key={o.id} className="flex items-center gap-3 border-b border-[#F4F3F6] pb-3 last:border-0 last:pb-0">
                    {o.image && (
                      <img src={o.image} alt={o.productTitle} className="w-10 h-10 rounded-xl object-cover border border-border shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-charcoal truncate">{o.productTitle}</p>
                      <p className="text-[10px] text-muted-foreground">{o.id} · {o.customerName} · {o.city}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary">{PKR(o.collect)}</p>
                      <span className="text-[10px] text-muted-foreground font-semibold">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === "orders" && <OrdersAdmin />}
      {tab === "categories" && <CategoriesAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "unlocks" && <UnlocksAdmin />}
      {tab === "payouts" && <PayoutsAdmin />}
      {tab === "users" && <UsersAdmin />}
      {tab === "registrations" && <RegistrationsAdmin />}
      {tab === "chat" && <ChatInbox />}
    </DashboardLayout>
  );
}

function OrdersAdmin() {
  const { s, setStatus, bookOrders } = useStore();
  const rName = (id: string) => s.resellers.find((r) => r.id === id)?.brandName ?? id;
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [courier, setCourier] = useState("PostEx");
  const [printMode, setPrintMode] = useState(false);

  // Date Range Quick Filter
  const [dateFilter, setDateFilter] = useState<"Today" | "Yesterday" | "Last 7 Days" | "Custom Date">("Today");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Print Status Filter (Unprinted Only)
  const [showUnprintedOnly, setShowUnprintedOnly] = useState(true);

  // Filter orders based on range & print status
  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toDateString();
    
    return s.orders.filter((o) => {
      // 1. Date Filter
      const orderDate = new Date(o.createdAt);
      const orderDateStr = orderDate.toDateString();

      let matchDate = true;
      if (dateFilter === "Today") {
        matchDate = orderDateStr === todayStr;
      } else if (dateFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        matchDate = orderDateStr === yesterday.toDateString();
      } else if (dateFilter === "Last 7 Days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        matchDate = orderDate >= sevenDaysAgo;
      } else if (dateFilter === "Custom Date") {
        matchDate = orderDateStr === new Date(customDate).toDateString();
      }

      // 2. Unprinted Filter
      let matchPrint = true;
      if (showUnprintedOnly) {
        matchPrint = !o.isPrinted;
      }

      return matchDate && matchPrint;
    });
  }, [s.orders, dateFilter, customDate, showUnprintedOnly]);

  const allSelected = filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id));
  const toggleAll = () => {
    if (allSelected) {
      // Unselect only the currently visible filtered orders
      const visibleIds = filteredOrders.map(o => o.id);
      setSelectedOrders(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select only the currently visible filtered orders
      const visibleIds = filteredOrders.map(o => o.id);
      setSelectedOrders(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handlePrint = () => {
    if (selectedOrders.length === 0) return;
    bookOrders(selectedOrders, courier);
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
      setSelectedOrders([]);
    }, 500);
  };

  const openProduct = (productId: string) => {
    const p = s.products.find(p => p.id === productId);
    if (p) { setViewProduct(p); setImgIdx(0); }
  };

  if (printMode) {
    const ordersToPrint = s.orders.filter(o => selectedOrders.includes(o.id));
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-200 overflow-y-auto pt-8">
        <style>{`
          @media print { 
            body * { visibility: hidden; } 
            .print-section, .print-section * { visibility: visible; } 
            .print-section { position: absolute; left: 0; top: 0; width: 100%; } 
            @page { size: 4in 6in; margin: 0; }
          }
        `}</style>
        <div className="print-section flex flex-col items-center">
           {ordersToPrint.map(o => <ThermalLabel key={o.id} order={o} />)}
        </div>
      </div>
    );
  }

  // Get active display date string for button badge
  const displayDateStr = dateFilter === "Today" 
    ? "Today" 
    : dateFilter === "Custom Date" 
      ? customDate 
      : dateFilter;

  return (
    <>
    <div className="overflow-hidden rounded-3xl border border-border bg-background card-shadow">
      <div className="p-5 md:p-6 border-b border-border/60">
        <h3 className="text-lg font-black text-charcoal">All Platform Orders</h3>
        <p className="text-xs text-muted-foreground">Click a product to view full details. Manage fulfillment pipeline and status triggers.</p>
      </div>

      {/* ── Bulk Action Bar & Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-b border-border/60 bg-surface/50">
        {/* Left Side: Select All, Courier & Primary Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-border/60">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="select-all-orders" />
            <label htmlFor="select-all-orders" className="text-xs font-semibold text-charcoal cursor-pointer select-none">
              {selectedOrders.length > 0 ? `${selectedOrders.length} selected` : "Select Visible"}
            </label>
          </div>

          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="h-8 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="PostEx">PostEx</option>
            <option value="Leopards">Leopards</option>
            <option value="Trax">Trax</option>
          </select>

          <Button
            size="sm"
            disabled={selectedOrders.length === 0}
            onClick={handlePrint}
            className="gap-2 disabled:opacity-40"
          >
            🖨️ Book &amp; Print Selected Labels
            {selectedOrders.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">
                {selectedOrders.length} {selectedOrders.length === 1 ? "Order" : "Orders"} Selected for {displayDateStr}
              </span>
            )}
          </Button>
        </div>

        {/* Right Side: Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Unprinted Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-charcoal">
            <input 
              type="checkbox"
              checked={showUnprintedOnly}
              onChange={(e) => setShowUnprintedOnly(e.target.checked)}
              className="rounded border-border bg-background text-primary focus:ring-primary/40 h-4 w-4"
            />
            Show Unprinted Only
          </label>

          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="h-8 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Custom Date">Custom Date</option>
            </select>

            {dateFilter === "Custom Date" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-8 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead className="w-[130px]">Reseller</TableHead>
                <TableHead className="w-[140px]">Customer</TableHead>
                <TableHead className="w-[170px]">Destination</TableHead>
                <TableHead className="w-[90px]">Collect</TableHead>
                <TableHead className="w-[90px]">Margin</TableHead>
                <TableHead className="w-[160px]">Tracking Info</TableHead>
                <TableHead className="w-[260px]">Fulfillment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">No orders matching the selected filters.</TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedOrders.includes(o.id)} 
                        onCheckedChange={(c) => {
                          if (c) setSelectedOrders([...selectedOrders, o.id]);
                          else setSelectedOrders(selectedOrders.filter(id => id !== o.id));
                        }} 
                      />
                    </TableCell>
                    {/* Clickable product cell */}
                    <TableCell>
                      <button
                        onClick={() => openProduct(o.productId)}
                        className="flex items-center gap-3 text-left group w-full rounded-xl p-1 -m-1 hover:bg-primary/5 transition-colors"
                        title="Click to view product details"
                      >
                        {o.image && (
                          <img
                            src={o.image}
                            alt={o.productTitle}
                            className="h-14 w-14 rounded-xl object-cover border border-border shrink-0 shadow-sm group-hover:border-primary/40 transition-all"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="text-primary font-bold text-xs block">{o.id}</span>
                          {o.trackingId && (
                            <a href={`https://postex.pk/tracking/${o.trackingId}`} target="_blank" rel="noreferrer" className="block text-[10px] text-blue-600 hover:underline mb-1" onClick={(e) => e.stopPropagation()}>
                              Track: {o.trackingId}
                            </a>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="block max-w-[10rem] truncate text-xs font-semibold text-charcoal group-hover:text-primary transition-colors">{o.productTitle}</span>
                            {o.status === "Pending" && (
                                <Badge variant="destructive" className="h-4 px-1 text-[9px] uppercase">New</Badge>
                            )}
                          </div>
                          <span className="block text-[11px] text-muted-foreground">{o.variant}</span>
                          <span className="block text-[10px] text-primary/60 font-semibold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">View product →</span>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-[120px]">{rName(o.resellerId)}</TableCell>
                    <TableCell>
                      <span className="font-medium text-charcoal truncate block max-w-[130px]">{o.customerName}</span>
                      <span className="block text-xs text-muted-foreground">{o.phone1}</span>
                    </TableCell>
                    <TableCell className="max-w-[16rem] text-xs leading-tight">
                      <span className="font-semibold text-charcoal">{o.city}</span> — <span className="text-muted-foreground truncate">{o.address}</span>
                    </TableCell>
                    <TableCell className="font-bold text-charcoal">{PKR(o.collect)}</TableCell>
                    <TableCell className="font-bold text-primary">{PKR(o.profit)}</TableCell>
                    <TableCell>
                      {o.trackingId ? (
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold text-muted-foreground uppercase">{o.courier}</span>
                          <a
                            href={`https://postex.pk/tracking/${o.trackingId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            {o.trackingId} ↗
                          </a>
                        </div>
                      ) : (
                        <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">Not Generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              onClick={() => {
                                setStatus(o.id, st);
                                toast[st === "Returned" ? "error" : "success"](
                                  st === "Returned" ? `RTO penalty applied — PKR 250 deducted from ${rName(o.resellerId)}` : `Order ${o.id} updated to ${st}`,
                                );
                              }}
                              className={`rounded-xl px-2 py-1 text-[11px] font-bold transition-all ${o.status === st
                                ? "bg-primary text-primary-foreground shadow-sm scale-105"
                                : "bg-surface text-muted-foreground hover:bg-accent hover:text-charcoal"
                                }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                        {o.status === "READY_FOR_PICKUP" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] w-fit border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              setStatus(o.id, "Dispatched");
                              toast.success(`Simulated Scan: Order ${o.id} Dispatched`);
                            }}
                          >
                            [ Mark as DISPATCHED 🚚 ]
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>

    {/* Product Detail Dialog */}
    <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
      <DialogContent className="max-w-2xl">
        {viewProduct && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-charcoal">{viewProduct.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {s.categories.find(c => c.id === viewProduct.categoryId)?.title ?? "Uncategorized"} · Product ID: {viewProduct.id}
              </p>
            </DialogHeader>
            <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
              {/* Images */}
              <div>
                <div className="rounded-2xl overflow-hidden border border-border aspect-square bg-surface">
                  <img
                    src={viewProduct.images[imgIdx]}
                    alt={viewProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {viewProduct.images.length > 1 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {viewProduct.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`h-12 w-12 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? "border-primary shadow-sm" : "border-transparent opacity-60 hover:opacity-100"}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{viewProduct.hook}</p>

                {/* Pricing */}
                <div className="rounded-2xl bg-surface border border-border/60 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wholesale Price</span>
                    <span className="text-lg font-black text-primary">{PKR(viewProduct.wholesale)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested Sale</span>
                    <span className="text-base font-bold text-charcoal">{PKR(viewProduct.suggested)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/60 pt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Est. Profit</span>
                    <span className="text-base font-black text-emerald-600">+{PKR(viewProduct.suggested - viewProduct.wholesale - 250)}</span>
                  </div>
                </div>

                {/* Stock & variants */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${viewProduct.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                    {viewProduct.stock > 0 ? `✓ In Stock · ${viewProduct.stock} units` : "✗ Out of Stock"}
                  </span>
                  {viewProduct.colors.length > 0 && (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-muted-foreground">
                      Colors: {viewProduct.colors.join(", ")}
                    </span>
                  )}
                  {viewProduct.sizes.length > 0 && (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-muted-foreground">
                      Sizes: {viewProduct.sizes.join(", ")}
                    </span>
                  )}
                </div>

                {viewProduct.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-3">{viewProduct.description}</p>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {selectedOrders.length > 0 && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-charcoal text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5">
        <span className="font-bold text-sm whitespace-nowrap">{selectedOrders.length} orders selected</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">Courier:</span>
          <select 
            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
            value={courier} 
            onChange={(e) => setCourier(e.target.value)}
          >
            <option className="text-charcoal" value="PostEx">PostEx</option>
            <option className="text-charcoal" value="Leopards">Leopards</option>
            <option className="text-charcoal" value="Trax">Trax</option>
          </select>
        </div>
        <Button onClick={handlePrint} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg whitespace-nowrap">
          Book & Print Labels
        </Button>
      </div>
    )}
    </>
  );
}

function CategoriesAdmin() {
  const { s, addCategory, deleteCategory } = useStore();
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] items-start">
      <div className="space-y-4 rounded-3xl border border-border bg-background p-6 md:p-8 card-shadow">
        <div>
          <h3 className="text-lg font-black text-charcoal">Create Category</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Add new item groupings to catalog.</p>
        </div>
        <div className="space-y-2">
          <Label>Category Title</Label>
          <Input placeholder="e.g. Winter Luxury Wear" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cover Image</Label>
          <Input type="file" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setImage(await fileToDataUrl(f));
          }} />
        </div>
        {image && <img src={image} alt="Preview" className="h-32 w-full rounded-2xl object-cover border border-border" />}
        <Button
          className="w-full font-bold shadow-md"
          onClick={() => {
            if (!title) { toast.error("Category title required"); return; }
            addCategory(title, image || IMG(PHOTO_POOL[Math.floor(Math.random() * PHOTO_POOL.length)]));
            setTitle(""); setImage("");
            toast.success("Category published successfully!");
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Publish Category
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {s.categories.map((c) => {
          const count = s.products.filter(p => p.categoryId === c.id).length;
          return (
            <div key={c.id} className="group overflow-hidden rounded-3xl border border-border bg-background card-shadow transition-all duration-300 hover:border-primary/50">
              <div className="relative h-40 overflow-hidden">
                <img src={c.image} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 text-white text-xs font-black bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-xl">
                  {count} {count === 1 ? "product" : "products"}
                </span>
              </div>
              <div className="flex items-center justify-between p-4">
                <p className="font-bold text-charcoal truncate">{c.title}</p>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteCategory(c.id)} aria-label="Delete category">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const emptyProduct = (categoryId: string): Product => ({
  id: "", title: "", description: "", wholesale: 1000, suggested: 2000, stock: 50,
  categoryId, images: [IMG(PHOTO_POOL[0])], colors: [], sizes: [],
  hook: "New winning product — cash on delivery all over Pakistan!",
});

function ProductsAdmin() {
  const { s, saveProduct, deleteProduct, approveVendorProduct, rejectVendorProduct, approveProductAction, rejectProductAction } = useStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Product>(emptyProduct(s.categories[0]?.id ?? "c1"));
  const [viewRequest, setViewRequest] = useState<any>(null);
  const [q, setQ] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [colorPriceInput, setColorPriceInput] = useState<number>(0);
  const [sizeInput, setSizeInput] = useState("");
  const [sizePriceInput, setSizePriceInput] = useState<number>(0);

  const addChip = (field: "colors" | "sizes", name: string, price: number) => {
    const v = name.trim();
    if (!v || draft[field].includes(v)) return;
    if (field === "colors") {
      setDraft(d => ({
        ...d,
        colors: [...d.colors, v],
        colorPricing: price > 0 ? { ...(d.colorPricing ?? {}), [v]: price } : d.colorPricing,
      }));
      setColorInput(""); setColorPriceInput(0);
    } else {
      setDraft(d => ({
        ...d,
        sizes: [...d.sizes, v],
        sizePricing: price > 0 ? { ...(d.sizePricing ?? {}), [v]: price } : d.sizePricing,
      }));
      setSizeInput(""); setSizePriceInput(0);
    }
  };

  const removeChip = (field: "colors" | "sizes", val: string) => {
    if (field === "colors") {
      setDraft(d => {
        const cp = { ...(d.colorPricing ?? {}) };
        delete cp[val];
        const ci = { ...(d.colorImages ?? {}) };
        delete ci[val];
        return { ...d, colors: d.colors.filter(x => x !== val), colorPricing: cp, colorImages: ci };
      });
    } else {
      setDraft(d => {
        const sp = { ...(d.sizePricing ?? {}) };
        delete sp[val];
        return { ...d, sizes: d.sizes.filter(x => x !== val), sizePricing: sp };
      });
    }
  };

  const openAdd = () => {
    setDraft(emptyProduct(s.categories[0]?.id ?? "c1"));
    setColorInput(""); setColorPriceInput(0);
    setSizeInput(""); setSizePriceInput(0);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setDraft(p);
    setColorInput(""); setColorPriceInput(0);
    setSizeInput(""); setSizePriceInput(0);
    setOpen(true);
  };

  const pendingList = s.products.filter(p => p.approvalStatus === "PENDING_ADMIN_APPROVAL" && p.title.toLowerCase().includes(q.toLowerCase()));
  const activeList = s.products.filter((p) => p.approvalStatus !== "PENDING_ADMIN_APPROVAL" && p.approvalStatus !== "DELETED" && p.rejectionReason !== "Deleted by vendor" && p.rejectionReason !== "Deleted by admin" && p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-border bg-background p-5 md:p-6 card-shadow">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 bg-surface" placeholder="Search catalog products..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <span className="text-xs font-semibold text-muted-foreground">{s.products.length} Items Listed</span>
          <Button className="font-bold shadow-md" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {s.productActionRequests?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-black text-blue-500 mb-3 flex items-center gap-2"><MessageSquareCode className="h-5 w-5" /> Vendor Edit/Delete Requests</h2>
          <div className="overflow-hidden rounded-3xl border border-blue-200 bg-blue-50/30 card-shadow">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.productActionRequests.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="flex items-center gap-3">
                        <img src={r.product?.images?.[0] || ""} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover border border-border shadow-sm" />
                        <div className="min-w-0">
                          <span className="font-bold text-charcoal block truncate max-w-[14rem]">{r.product?.title || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground truncate block max-w-[14rem]">SKU: {r.product?.sku || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-charcoal">{r.vendor?.brandName || r.vendorId}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={r.type === "DELETE" ? "border-destructive text-destructive" : "border-primary text-primary"}>
                          {r.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.type === "EDIT" ? (
                          <span className="text-xs text-muted-foreground">Vendor wants to update details (Price, Stock, etc.)</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Vendor wants to remove this product.</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setViewRequest(r)}>View</Button>
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white rounded-xl" onClick={() => approveProductAction(r.id)}>Approve</Button>
                        <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => {
                          const reason = prompt("Enter reason for rejection:");
                          if (reason) rejectProductAction(r.id, reason);
                        }}>Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {pendingList.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-black text-amber-500 mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Pending Approvals</h2>
          <div className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50/30 card-shadow">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Wholesale</TableHead>
                    <TableHead>Suggested</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingList.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover border border-border shadow-sm" />
                        <div className="min-w-0">
                          <span className="font-bold text-charcoal block truncate max-w-[14rem]">{p.title}</span>
                          <span className="text-xs text-muted-foreground truncate block max-w-[14rem]">Vendor ID: {p.vendorId}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-xs font-semibold">{s.categories.find(c => c.id === p.categoryId)?.title}</span></TableCell>
                      <TableCell className="font-bold text-charcoal">{PKR(p.wholesale)}</TableCell>
                      <TableCell className="font-bold text-primary">{PKR(p.suggested)}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white rounded-xl" onClick={() => { approveVendorProduct(p.id); toast.success("Approved!"); }}>Approve</Button>
                        <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => { rejectVendorProduct(p.id); toast.error("Rejected"); }}>Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border bg-background card-shadow">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Product</TableHead>
                  <TableHead className="w-[140px]">Category</TableHead>
                  <TableHead className="w-[110px]">Wholesale</TableHead>
                  <TableHead className="w-[110px]">Suggested</TableHead>
                  <TableHead className="w-[90px]">Stock</TableHead>
                  <TableHead className="text-right w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No matching products found.</TableCell>
                  </TableRow>
                ) : (
                  activeList.slice(0, 40).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover border border-border shadow-sm" />
                        <div className="min-w-0">
                          <span className="font-bold text-charcoal block truncate max-w-[14rem]">{p.title}</span>
                          <span className="text-xs text-muted-foreground truncate block max-w-[14rem]">{p.hook}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground border border-border/60 truncate max-w-[120px]">
                          {s.categories.find((c) => c.id === p.categoryId)?.title ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-charcoal">{PKR(p.wholesale)}</TableCell>
                      <TableCell className="font-bold text-primary">{PKR(p.suggested)}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-charcoal">{p.stock} units</span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="font-semibold rounded-xl" onClick={() => openEdit(p)}>Edit</Button>
                        <Button size="sm" variant="destructive" className="font-semibold rounded-xl" onClick={() => { deleteProduct(p.id); toast.success("Product deleted successfully"); }}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-charcoal">{draft.id ? "Edit Product Details" : "Add New Catalog Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Product Title</Label>
              <Input className="mt-1.5" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Premium Linen Suit" />
            </div>
            <div>
              <Label>Marketing Hook / Subtitle</Label>
              <Input className="mt-1.5" value={draft.hook} onChange={(e) => setDraft({ ...draft, hook: e.target.value })} />
            </div>
            <div>
              <Label>Full Description</Label>
              <Textarea className="mt-1.5" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Wholesale (PKR)</Label>
                <Input className="mt-1.5" type="number" value={draft.wholesale} onChange={(e) => setDraft({ ...draft, wholesale: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Suggested (PKR)</Label>
                <Input className="mt-1.5" type="number" value={draft.suggested} onChange={(e) => setDraft({ ...draft, suggested: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input className="mt-1.5" type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={draft.categoryId} onValueChange={(v) => setDraft({ ...draft, categoryId: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{s.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Colors variant chips */}
            <div>
              <Label>Colors <span className="text-muted-foreground font-normal">(leave empty = no color option shown)</span></Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addChip("colors", colorInput, colorPriceInput); } }}
                  placeholder="Color name e.g. Black"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={colorPriceInput || ""}
                  onChange={e => setColorPriceInput(Number(e.target.value))}
                  placeholder="Price (PKR)"
                  className="w-32"
                />
                <Button type="button" variant="outline" className="shrink-0" onClick={() => addChip("colors", colorInput, colorPriceInput)}>Add</Button>
              </div>
              {draft.colors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {draft.colors.map(c => {
                    const price = draft.colorPricing?.[c];
                    return (
                      <span key={c} className="flex items-center gap-2 rounded-none uppercase bg-primary/10 pl-1.5 pr-3 py-1 text-xs font-semibold text-primary border border-primary/20 shadow-sm">
                        <label className="cursor-pointer shrink-0 h-6 w-6 rounded border border-primary/30 flex items-center justify-center overflow-hidden bg-white hover:border-primary transition-colors">
                          {draft.colorImages?.[c] ? (
                            <img src={draft.colorImages[c]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-bold text-primary/60">+Img</span>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await fileToDataUrl(f);
                              setDraft(d => ({ ...d, colorImages: { ...(d.colorImages ?? {}), [c]: url } }));
                            }
                          }} />
                        </label>
                        <span>{c}</span>
                        {price ? (
                          <span className="bg-primary text-white rounded-lg px-1.5 py-0.5 text-[10px] font-black">{PKR(price)}</span>
                        ) : (
                          <span className="text-primary/50 text-[10px]">base price</span>
                        )}
                        <button type="button" onClick={() => removeChip("colors", c)} className="ml-1 text-primary/60 hover:text-destructive transition-colors">×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              {draft.colors.length === 0 && <p className="mt-1.5 text-xs text-muted-foreground">No colors added — color dropdown won't show on order form.</p>}
            </div>

            {/* Sizes variant chips */}
            <div>
              <Label>Sizes <span className="text-muted-foreground font-normal">(leave empty = no size option shown)</span></Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={sizeInput}
                  onChange={e => setSizeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addChip("sizes", sizeInput, sizePriceInput); } }}
                  placeholder="Size name e.g. S / M / L"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={sizePriceInput || ""}
                  onChange={e => setSizePriceInput(Number(e.target.value))}
                  placeholder="Price (PKR)"
                  className="w-32"
                />
                <Button type="button" variant="outline" className="shrink-0" onClick={() => addChip("sizes", sizeInput, sizePriceInput)}>Add</Button>
              </div>
              {draft.sizes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {draft.sizes.map(sz => {
                    const price = draft.sizePricing?.[sz];
                    return (
                      <span key={sz} className="flex items-center gap-1.5 rounded-none uppercase bg-surface border border-border px-3 py-1.5 text-xs font-semibold text-charcoal">
                        <span>{sz}</span>
                        {price ? (
                          <span className="bg-charcoal text-white rounded-lg px-1.5 py-0.5 text-[10px] font-black">{PKR(price)}</span>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">base price</span>
                        )}
                        <button type="button" onClick={() => removeChip("sizes", sz)} className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors">×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              {draft.sizes.length === 0 && <p className="mt-1.5 text-xs text-muted-foreground">No sizes added — size dropdown won't show on order form.</p>}
            </div>
            <div>
              <Label>Product Gallery Images</Label>
              <Input className="mt-1.5" type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setDraft({ ...draft, images: [await fileToDataUrl(f), ...draft.images] });
              }} />
              <div className="mt-3 flex gap-2 flex-wrap">
                {draft.images.map((i) => <img key={i} src={i} alt="Gallery" className="h-16 w-16 rounded-2xl object-cover border border-border shadow-sm" />)}
              </div>
            </div>
            <Button className="w-full font-bold shadow-lg mt-4 py-3" onClick={() => {
              if (!draft.title) { toast.error("Product title is required"); return; }
              saveProduct(draft); setOpen(false); toast.success("Product successfully saved to catalog");
            }}>
              Save Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewRequest} onOpenChange={(o) => !o && setViewRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {viewRequest && (() => {
            const product = viewRequest.product;
            const parsedData = (() => {
              try {
                return viewRequest.requestedData ? JSON.parse(viewRequest.requestedData) : null;
              } catch { return null; }
            })();

            // Friendly labels for fields
            const fieldLabels: Record<string, string> = {
              title: "Product Title", description: "Description", wholesale: "Wholesale Price (PKR)",
              suggested: "Suggested Price (PKR)", minSellingPrice: "Min Selling Price (PKR)",
              stock: "Stock", weight: "Weight (g)", hook: "Sales Hook", categoryId: "Category",
              lowStockThreshold: "Low Stock Alert", colors: "Colors", sizes: "Sizes",
              colorPricing: "Color Pricing", sizePricing: "Size Pricing", images: "Images",
              videoUrl: "Video", colorImages: "Color Images",
            };

            const formatVal = (val: any, key: string): string => {
              if (val === null || val === undefined || val === "") return "—";
              if (Array.isArray(val)) return val.length === 0 ? "None" : val.join(", ");
              if (typeof val === "object") return Object.entries(val).map(([k, v]) => `${k}: PKR ${v}`).join(", ");
              if (key === "wholesale" || key === "suggested" || key === "minSellingPrice") return `PKR ${val}`;
              if (key === "weight") return `${val}g`;
              return String(val);
            };

            return (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                  {product?.images?.[0] && (
                    <img src={product.images[0]} alt="" className="h-16 w-16 object-cover rounded-xl border border-border shadow-sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-charcoal">{product?.title}</p>
                    <p className="text-sm text-muted-foreground">Vendor: <span className="font-semibold text-charcoal">{viewRequest.vendor?.brandName}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">SKU: {product?.sku || "N/A"}</p>
                  </div>
                  <Badge className="ml-auto shrink-0" variant={viewRequest.type === "DELETE" ? "destructive" : "default"}>{viewRequest.type}</Badge>
                </div>

                {viewRequest.type === "DELETE" ? (
                  <div className="py-6 text-center">
                    <Trash2 className="mx-auto h-12 w-12 text-destructive/40 mb-3" />
                    <p className="text-charcoal font-medium">The vendor has requested to delete this product from the catalog.</p>
                    <p className="text-sm text-muted-foreground mt-1">Approving this will permanently remove the product.</p>
                  </div>
                ) : parsedData ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-charcoal text-sm flex items-center gap-2">
                      <MessageSquareCode className="h-4 w-4 text-primary" /> Proposed Changes
                    </h4>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface border-b border-border">
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[30%]">Field</th>
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[35%]">Current</th>
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[35%]">New Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(parsedData)
                            .filter(key => key !== "vendorId" && key !== "images" && key !== "colorImages" && key !== "videoUrl")
                            .map(key => {
                              const oldVal = product?.[key];
                              const newVal = parsedData[key];
                              const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                              return (
                                <tr key={key} className={`border-b border-border/40 ${changed ? "bg-amber-50/50" : ""}`}>
                                  <td className="px-4 py-2.5 font-semibold text-charcoal text-xs">{fieldLabels[key] || key}</td>
                                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatVal(oldVal, key)}</td>
                                  <td className={`px-4 py-2.5 text-xs font-semibold ${changed ? "text-primary" : "text-muted-foreground"}`}>
                                    {formatVal(newVal, key)}
                                    {changed && <span className="ml-1.5 inline-block text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">Changed</span>}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Image comparison */}
                    {parsedData.images && (
                      <div className="space-y-2 pt-2">
                        <h5 className="text-xs font-bold text-charcoal">New Images:</h5>
                        <div className="flex gap-2 flex-wrap">
                          {(Array.isArray(parsedData.images) ? parsedData.images : []).map((img: string, i: number) => (
                            <img key={i} src={img} alt={`New ${i+1}`} className="h-16 w-16 object-cover rounded-xl border border-primary/40 shadow-sm" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video */}
                    {parsedData.videoUrl && (
                      <div className="space-y-2 pt-2">
                        <h5 className="text-xs font-bold text-charcoal">New Video:</h5>
                        <video src={parsedData.videoUrl} controls className="w-full max-h-48 object-contain rounded-xl border border-border bg-black" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground text-sm">No change data available.</div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>
                  <Button variant="destructive" onClick={() => {
                    const reason = prompt("Enter reason for rejection:");
                    if (reason) {
                      rejectProductAction(viewRequest.id, reason);
                      setViewRequest(null);
                    }
                  }}>Reject</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                    approveProductAction(viewRequest.id);
                    setViewRequest(null);
                  }}>Approve</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UnlocksAdmin() {
  const { s, approveUnlock } = useStore();
  const [viewImg, setViewImg] = useState<string | null>(null);

  return (
    <>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {s.unlocks.length === 0 ? (
        <div className="col-span-full rounded-3xl border border-border bg-background p-12 text-center card-shadow">
          <KeyRound className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-bold text-charcoal">No pending unlock requests</p>
          <p className="text-xs text-muted-foreground mt-1">Wallet top-ups submitted by resellers will appear here.</p>
        </div>
      ) : (
        s.unlocks.map((u) => {
          const r = s.resellers.find((x) => x.id === u.resellerId);
          return (
            <div key={u.id} className="rounded-3xl border border-border bg-background p-6 card-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-black text-charcoal text-lg">{r?.brandName ?? "Unknown Brand"}</p>
                  <Badge variant={u.status === "Approved" ? "default" : "outline"} className="font-bold px-3 py-1">
                    {u.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs font-semibold text-primary">Reseller: {r?.name}</p>
                <p className="mt-2 text-xs font-mono bg-surface p-2 rounded-xl border border-border/60">TRX Reference: {u.trxId}</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-surface relative group cursor-zoom-in" onClick={() => setViewImg(u.receipt)}>
                  <img src={u.receipt} alt="Top-up receipt" className="h-44 w-full object-cover transition-transform hover:scale-105 duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-xl">🔍 Click to enlarge</span>
                  </div>
                </div>
              </div>
              <Button
                className="mt-6 w-full font-bold shadow-md"
                disabled={u.status === "Approved"}
                onClick={() => { approveUnlock(u.id); toast.success("+PKR 500 credited — seller account successfully unlocked"); }}
              >
                {u.status === "Approved" ? "Already Approved" : "Approve & Credit PKR 500"}
              </Button>
            </div>
          );
        })
      )}
    </div>

    {/* Full-screen image viewer */}
    <Dialog open={!!viewImg} onOpenChange={() => setViewImg(null)}>
      <DialogContent className="max-w-3xl p-2">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-black text-charcoal">Top-up Receipt</DialogTitle>
        </DialogHeader>
        {viewImg && (
          <img src={viewImg} alt="Receipt" className="w-full rounded-2xl object-contain max-h-[75vh]" />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

function PayoutsAdmin() {
  const { s, markPaid } = useStore();
  const [proofs, setProofs] = useState<Record<string, string>>({});
  const [viewImg, setViewImg] = useState<string | null>(null);

  return (
    <>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {s.payouts.length === 0 ? (
        <div className="col-span-full rounded-3xl border border-border bg-background p-12 text-center card-shadow">
          <WalletCards className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-bold text-charcoal">No payout requests recorded</p>
          <p className="text-xs text-muted-foreground mt-1">Withdrawal slips generated by resellers will display here.</p>
        </div>
      ) : (
        s.payouts.map((p) => {
          const r = s.resellers.find((x) => x.id === p.resellerId);
          return (
            <div key={p.id} className="rounded-3xl border border-border bg-background p-6 card-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-black text-charcoal text-lg">{r?.brandName ?? "Seller"}</p>
                  <Badge variant={p.status === "Paid" ? "default" : "outline"} className="font-bold px-3 py-1">
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-2 text-3xl font-black text-primary">{PKR(p.amount)}</p>
                <div className="mt-3 rounded-2xl bg-surface p-3 border border-border/60 text-xs space-y-1">
                  <p className="font-semibold text-charcoal">Method: {p.method}</p>
                  <p className="text-muted-foreground">Account Name: <span className="font-medium text-charcoal">{p.accountName}</span></p>
                  <p className="text-muted-foreground">Account No: <span className="font-medium text-charcoal">{p.accountNumber}</span></p>
                </div>
              </div>

              <div className="mt-6">
                {p.proof ? (
                  <div>
                    <Label className="text-xs font-bold text-emerald-600">Payment Proof Attached</Label>
                    <div className="relative group cursor-zoom-in mt-2" onClick={() => setViewImg(p.proof!)}>
                      <img src={p.proof} alt="Payment proof" className="h-36 w-full rounded-2xl object-cover border border-border shadow-sm" />
                      <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-xl">🔍 Click to enlarge</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div>
                      <Label className="text-xs font-bold">Upload Bank Transfer Receipt</Label>
                      <Input id={`proof-upload-${p.id}`} className="mt-1.5 text-xs" type="file" accept="image/*" />
                    </div>
                    <Button
                      className="w-full font-bold shadow-md"
                      onClick={async () => {
                        const input = document.getElementById(`proof-upload-${p.id}`) as HTMLInputElement;
                        const f = input?.files?.[0];
                        if (!f) { toast.error("Please attach payment screenshot proof first"); return; }
                        const proof = await fileToDataUrl(f);
                        markPaid(p.id, proof);
                        toast.success("Payout marked as paid — receipt pinned to reseller ledger");
                      }}
                    >
                      Mark Paid & Attach Proof
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* Full-screen proof image viewer */}
    <Dialog open={!!viewImg} onOpenChange={() => setViewImg(null)}>
      <DialogContent className="max-w-3xl p-2">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base font-black text-charcoal">Payment Proof</DialogTitle>
        </DialogHeader>
        {viewImg && (
          <img src={viewImg} alt="Proof" className="w-full rounded-2xl object-contain max-h-[75vh]" />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

function UsersAdmin() {
  const { s, credit } = useStore();
  const [amt, setAmt] = useState<Record<string, number>>({});

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background card-shadow">
      <div className="p-5 md:p-6 border-b border-border/60">
        <h3 className="text-lg font-black text-charcoal">Registered Resellers & Wallet Ledger</h3>
        <p className="text-xs text-muted-foreground">Inspect seller balances, contact credentials, and perform emergency wallet credit/debit overrides.</p>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[700px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Reseller Brand</TableHead>
                <TableHead className="w-[140px]">Phone Number</TableHead>
                <TableHead className="w-[110px]">Total Orders</TableHead>
                <TableHead className="w-[120px]">Wallet Balance</TableHead>
                <TableHead className="w-[120px]">Account Status</TableHead>
                <TableHead className="text-right w-[180px]">Manual Override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.resellers.map((r) => {
                const orderCount = s.orders.filter((o) => o.resellerId === r.id).length;
                const isLocked = r.balance <= -500;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="flex items-center gap-3">
                      <img src={r.brandLogo} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover border border-border shadow-sm" />
                      <div className="min-w-0">
                        <span className="font-bold text-charcoal block truncate max-w-[130px]">{r.brandName}</span>
                        <span className="text-xs text-muted-foreground truncate block max-w-[130px]">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[130px]">{r.phone}</TableCell>
                    <TableCell><span className="font-semibold text-charcoal">{orderCount} orders</span></TableCell>
                    <TableCell className={`font-black ${r.balance < 0 ? "text-destructive" : "text-primary"}`}>
                      {PKR(r.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isLocked ? "destructive" : "outline"} className="font-bold px-2 py-1 text-[10px]">
                        {isLocked ? "Locked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Input
                          className="w-20 text-xs bg-surface h-8 px-2"
                          type="number"
                          placeholder="Amt"
                          value={amt[r.id] ?? ""}
                          onChange={(e) => setAmt({ ...amt, [r.id]: Number(e.target.value) })}
                        />
                        <Button
                          size="sm"
                          className="font-bold rounded-xl h-8 px-2.5 text-xs"
                          onClick={() => {
                            const val = amt[r.id];
                            if (!val) { toast.error("Enter amount to adjust"); return; }
                            credit(r.id, val, "Manual balance override by Owner", "Adjustment");
                            toast.success("Wallet balance adjusted successfully");
                            setAmt({ ...amt, [r.id]: 0 });
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function ChatInbox() {
  const { s, send } = useStore();
  const [active, setActive] = useState<string>("");
  const [text, setText] = useState("");

  const contacts = useMemo(() => {
    return [
      ...s.resellers.map(r => ({ ...r, type: "Reseller" })),
      ...s.vendors.map(v => ({ ...v, type: "Vendor", name: v.name, brandName: v.brandName, brandLogo: v.brandLogo }))
    ];
  }, [s.resellers, s.vendors]);

  const activeContact = contacts.find((c) => c.id === active);
  const msgs = s.messages.filter((m) => m.resellerId === active);

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] items-start">
      <div className="space-y-2 rounded-3xl border border-border bg-background p-4 card-shadow">
        <p className="px-3 pt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversations</p>
        <div className="space-y-1 pt-2">
          {contacts.map((c) => {
            const isSelected = active === c.id;
            const contactMsgs = s.messages.filter(m => m.resellerId === c.id);
            const lastMsg = contactMsgs.length > 0 ? contactMsgs[contactMsgs.length - 1].text : "No messages yet";

            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-surface text-charcoal"
                  }`}
              >
                <div className="relative">
                  <img src={c.brandLogo} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover border border-border/40 shadow-sm" />
                  <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] font-bold rounded-md ${c.type === 'Vendor' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {c.type === 'Vendor' ? 'V' : 'R'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-bold ${isSelected ? "text-primary-foreground" : "text-charcoal"}`}>
                    {c.brandName}
                  </p>
                  <p className={`truncate text-xs ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {lastMsg}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Box Panel */}
      <div className="flex h-[36rem] flex-col rounded-3xl border border-border bg-background card-shadow overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b border-border/60 bg-surface px-6 py-4">
          {activeContact ? (
            <>
              <img src={activeContact.brandLogo} alt="" className="h-10 w-10 shrink-0 rounded-2xl object-cover border border-border" />
              <div className="min-w-0">
                <p className="font-bold text-charcoal truncate">{activeContact.brandName}</p>
                <p className="text-xs text-muted-foreground truncate">Owner Live Support Chat · {activeContact.name} ({activeContact.type})</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Select a contact to start chatting</p>
          )}
        </div>

        {/* Message History */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-surface/50 p-6">
          {msgs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm px-4">
              No conversation history with this reseller yet. Send a message below!
            </div>
          ) : (
            msgs.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.from === "admin"
                  ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                  : "border border-border/80 bg-background text-charcoal rounded-bl-sm"
                  }`}
              >
                {m.text && <p className="break-words">{m.text}</p>}
                {m.attachmentType === 'image' && m.attachmentUrl && <img src={m.attachmentUrl} className="mt-2 rounded-xl max-w-full h-auto max-h-48 object-cover shadow-sm border border-black/10" alt="Attached" />}
                {m.attachmentType === 'audio' && m.attachmentUrl && <audio src={m.attachmentUrl} controls className="mt-2 w-full max-w-[200px] h-8" />}
                {m.attachmentType === 'pdf' && m.attachmentUrl && <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-1 block font-bold">📄 View PDF Document</a>}
                <span className={`block mt-1 text-[10px] ${m.from === "admin" ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}>
                  {m.from === "admin" ? "You (Owner)" : activeContact?.brandName}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Message Input Form */}
        <form
          className="flex gap-2 sm:gap-3 border-t border-border/60 bg-background p-4 items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim() && !active) return;
            send(active, "admin", text.trim() || " ");
            setText("");
            toast.success("Reply sent");
          }}
        >
          <label className="cursor-pointer shrink-0">
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = await fileToDataUrl(f);
              const type = f.type.includes("pdf") ? "pdf" : "image";
              send(active, "admin", "", url, type);
            }} />
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface hover:bg-surface/80 text-muted-foreground transition-colors">
              <Paperclip className="h-5 w-5" />
            </div>
          </label>
          <button type="button" className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-surface hover:bg-surface/80 text-muted-foreground transition-colors" onClick={() => {
            // Mock voice note
            send(active, "admin", "", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "audio");
            toast.success("Voice note sent!");
          }}>
            <Mic className="h-5 w-5" />
          </button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your official reply..."
            className="bg-surface py-5 text-sm flex-1"
          />
          <Button size="icon" type="submit" className="h-10 w-10 shrink-0 rounded-xl shadow-md" disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function RegistrationsAdmin() {
  const { s, approveKyc, rejectKyc } = useStore();
  const [viewImg, setViewImg] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {s.kycRequests.map((k) => (
          <div key={k.id} className="overflow-hidden rounded-3xl border border-border bg-background card-shadow flex flex-col">
            <div className="p-5 border-b border-border/60">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-charcoal">{k.name}</h4>
                    <Badge variant="outline" className="text-[10px] bg-white border-primary/20 text-primary">
                      {k.accountType === "vendor" ? "Vendor" : "Reseller"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{k.email}</p>
                </div>
                <Badge variant={k.status === "Pending" ? "default" : k.status === "Approved" ? "secondary" : "destructive"}>
                  {k.status}
                </Badge>
              </div>

              <div className="space-y-3 mt-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</span>
                  <p className="font-medium text-charcoal mt-0.5">{k.phone}</p>
                </div>
                <div className="pt-3 border-t border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">ID Card</span>
                  <div className="flex gap-2 h-20">
                    <div 
                      className="flex-1 bg-surface border border-border rounded-lg overflow-hidden cursor-zoom-in relative group"
                      onClick={() => setViewImg(k.idFront)}
                    >
                      <img src={k.idFront} alt="ID Front" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold shadow-sm">Front</span>
                      </div>
                    </div>
                    <div 
                      className="flex-1 bg-surface border border-border rounded-lg overflow-hidden cursor-zoom-in relative group"
                      onClick={() => setViewImg(k.idBack)}
                    >
                      <img src={k.idBack} alt="ID Back" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold shadow-sm">Back</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bank Details</span>
                  <p className="text-xs mt-1 text-charcoal font-medium"><span className="text-muted-foreground">Bank:</span> {k.bankName}</p>
                  <p className="text-xs mt-0.5 text-charcoal font-medium"><span className="text-muted-foreground">Title:</span> {k.accountName}</p>
                  <p className="text-xs mt-0.5 text-charcoal font-medium"><span className="text-muted-foreground">A/C:</span> {k.accountNumber}</p>
                  {k.iban && <p className="text-xs mt-0.5 text-charcoal font-medium"><span className="text-muted-foreground">IBAN:</span> {k.iban}</p>}
                </div>
                {k.accountType === "vendor" && (k.stockVideo || k.stockImages) && (
                  <div className="pt-3 border-t border-border/40">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Vendor Setup & Stock</span>
                    {k.stockVideo && (
                      <div className="mb-3">
                        <span className="text-xs text-charcoal font-medium block mb-1">Stock Video</span>
                        <video src={k.stockVideo} controls className="w-full aspect-video max-h-48 object-contain rounded-lg border border-border bg-black" />
                      </div>
                    )}
                    {k.stockImages && (
                      <div>
                        <span className="text-xs text-charcoal font-medium block mb-1">Stock Images</span>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            try {
                              const imgs = typeof k.stockImages === 'string' ? JSON.parse(k.stockImages) : k.stockImages;
                              return imgs.map((img: string, i: number) => (
                                <div key={i} className="h-10 w-10 rounded border border-border overflow-hidden cursor-zoom-in" onClick={() => setViewImg(img)}>
                                  <img src={img} alt={`Stock ${i+1}`} className="w-full h-full object-cover" />
                                </div>
                              ));
                            } catch { return <span className="text-xs text-muted-foreground">Invalid images</span>; }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {k.status === "Pending" && (
              <div className="p-5 bg-surface mt-auto flex gap-3">
                <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-none" onClick={async () => { 
                  try {
                    await rejectKyc(k.id); 
                    toast("Application rejected"); 
                  } catch (e) {} // Error toast handled in store
                }}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" onClick={async () => { 
                  try {
                    await approveKyc(k.id); 
                    toast.success(`${k.accountType === "vendor" ? "Vendor" : "Reseller"} account created & approved!`); 
                  } catch (e) {} // Error toast handled in store
                }}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
              </div>
            )}
            
            {k.status !== "Pending" && (
              <div className="p-4 bg-surface mt-auto text-center text-xs text-muted-foreground">
                Processed on {new Date(k.date).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
        {s.kycRequests.length === 0 && (
          <div className="col-span-full rounded-3xl border border-border bg-background p-12 text-center card-shadow">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 font-bold text-charcoal">No pending registrations</p>
            <p className="text-xs text-muted-foreground mt-1">New reseller KYC applications will appear here for your review.</p>
          </div>
        )}
      </div>

      <Dialog open={!!viewImg} onOpenChange={(o) => !o && setViewImg(null)}>
        <DialogContent className="max-w-4xl p-1 bg-charcoal border-none shadow-2xl">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {viewImg && <img src={viewImg} className="max-w-full max-h-full object-contain rounded-lg" />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}