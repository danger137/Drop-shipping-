"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, Package, ClipboardList, Users, Folder, ShieldCheck,
  UploadCloud, AlertCircle, CheckCircle, FileText, Eye, Settings,
  Warehouse, TrendingUp, XCircle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, PKR } from "@/lib/store";
import { bulkImportProducts, type ImportResult } from "@/actions/import";
import { getAuditLogs } from "@/actions/audit";
import { processUnlockRequest, updateOrderStatus, getOrderTimeline } from "@/actions/orders";
import { approveWithdrawal } from "@/actions/wallet";
import { receiveStock, adjustStock, recordDamagedStock, getStockMovements } from "@/actions/inventory";
import { updatePlatformConfig } from "@/actions/config";

export default function AdminPage() {
  const router = useRouter();
  const { s, refreshData } = useStore();
  const [tab, setTab] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleKyc = async (kycId: string, approve: boolean) => {
    setLoading(kycId);
    try {
      const { processKycAction } = await import("@/actions/kyc");
      await processKycAction(kycId, approve, "Admin");
      toast.success(approve ? "KYC Approved — user account created" : "KYC Rejected");
      await refreshData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const stats = useMemo(() => {
    const vendorCount = s.vendors.length;
    const resellerCount = s.resellers.length;
    const productCount = s.products.length;
    const orderCount = s.orders.length;
    const revenue = s.orders.reduce((sum, o) => sum + o.collect, 0);
    const totalPaid = s.payouts.reduce((sum, p) => sum + (p.status === "Paid" ? p.amount : 0), 0);
    const pendingPayouts = s.payouts.reduce((sum, p) => sum + (p.status === "Pending" ? p.amount : 0), 0);
    return { vendorCount, resellerCount, productCount, orderCount, revenue, totalPaid, pendingPayouts };
  }, [s]);

  useEffect(() => {
    if (s.role === "guest") {
      router.replace("/login");
    } else if (s.role === "pending") {
      router.replace("/pending");
    } else if (s.role !== "admin") {
      router.replace("/app");
    }
  }, [s.role, router]);

  if (s.role !== "admin") return null;

  const pendingOrdersCount = s.orders.filter(o => o.status === "Pending").length;
  const pendingKycCount = s.kycRequests?.filter(k => k.status === "Pending").length || 0;
  const pendingUnlocks = s.unlocks?.filter(u => u.status === "Pending").length || 0;
  const pendingPayoutsCount = s.payouts?.filter(p => p.status === "Pending").length || 0;

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: ShieldCheck },
    { id: "orders", label: "Orders", icon: ClipboardList, badge: pendingOrdersCount },
    { id: "categories", label: "Categories", icon: Folder },
    { id: "products", label: "Products", icon: Package },
    { id: "inventory", label: "Inventory", icon: Warehouse },
    { id: "import", label: "Bulk Import", icon: UploadCloud },
    { id: "kyc", label: "KYC Approvals", icon: Users, badge: pendingKycCount },
    { id: "unlocks", label: "Unlocks", icon: CheckCircle, badge: pendingUnlocks },
    { id: "payouts", label: "Payouts", icon: DollarSign, badge: pendingPayoutsCount },
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "ledger", label: "Master Ledger", icon: TrendingUp },
    { id: "config", label: "Platform Config", icon: Settings },
  ];

  const filteredOrders = s.orders.filter(
    o => o.id.toLowerCase().includes(query.toLowerCase()) ||
         o.customerName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DashboardLayout title="Owner Super Dashboard" role="admin" items={sidebarItems} activeItem={tab} onItemChange={setTab}>
      <div className="space-y-6">
        {/* ── Top Metrics ── */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Vendors" value={String(stats.vendorCount)} icon={Users} />
          <Metric label="Resellers" value={String(stats.resellerCount)} icon={Users} />
          <Metric label="Products" value={String(stats.productCount)} icon={Package} />
          <Metric label="Orders" value={String(stats.orderCount)} icon={ClipboardList} />
        </div>

        {/* ── Dashboard ── */}
        {tab === "dashboard" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Total COD Collected</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-black">{PKR(stats.revenue)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Pending Payouts</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-black text-amber-600">{PKR(stats.pendingPayouts)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Paid Out</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-black text-emerald-600">{PKR(stats.totalPaid)}</p></CardContent>
            </Card>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === "orders" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Label>Search</Label>
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Order ID or customer name" className="max-w-xs" />
              <Button variant="outline" size="sm" onClick={refreshData}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
            </div>
            <Card>
              <CardHeader><CardTitle>All Platform Orders ({filteredOrders.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Reseller</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Courier</TableHead>
                        <TableHead>Collect</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Settlement</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[140px]">
                              {order.image && <img src={order.image} alt={order.productTitle} className="h-10 w-10 rounded-lg object-cover shrink-0" />}
                              <div>
                                <p className="font-semibold text-xs max-w-[120px] truncate">{order.productTitle}</p>
                                {order.status === "Pending" && <Badge variant="destructive" className="text-[9px] h-4 px-1">New</Badge>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{s.resellers.find(r => r.id === order.resellerId)?.brandName ?? order.resellerId}</TableCell>
                          <TableCell className="text-xs">{order.vendorId ? (s.vendors.find(v => v.id === order.vendorId)?.brandName ?? order.vendorId) : "—"}</TableCell>
                          <TableCell className="text-xs">{order.customerName}</TableCell>
                          <TableCell className="text-xs">{order.city}</TableCell>
                          <TableCell className="text-xs">{order.courier ?? "—"} <br/><span className="text-[10px] text-muted-foreground">{order.deliveryFee ? PKR(order.deliveryFee) : ""}</span></TableCell>
                          <TableCell className="font-semibold text-sm">{PKR(order.collect)}</TableCell>
                          <TableCell className="font-semibold text-sm text-primary">{PKR(order.profit)}</TableCell>
                          <TableCell className="text-xs font-mono">{order.trackingId ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.settlementStatus === "Settled" ? "default" : order.settlementStatus === "Eligible" ? "secondary" : "outline"} className="text-[10px]">
                              {order.settlementStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <OrderStatusChanger orderId={order.id} currentStatus={order.status} onDone={refreshData} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Categories ── */}
        {tab === "categories" && (
          <Card>
            <CardHeader><CardTitle>Categories ({s.categories.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.categories.map(c => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <img src={c.image} alt={c.title} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-sm">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{s.products.filter(p => p.categoryId === c.id).length} products</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Products ── */}
        {tab === "products" && (
          <Card>
            <CardHeader><CardTitle>Products ({s.products.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Wholesale</TableHead>
                      <TableHead>Suggested</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Sold</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img src={p.images[0]} alt={p.title} className="h-10 w-10 rounded-lg object-cover" />
                            <span className="font-semibold text-sm max-w-[140px] truncate">{p.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{p.sku ?? "—"}</TableCell>
                        <TableCell className="text-xs">{s.vendors.find(v => v.id === p.vendorId)?.brandName ?? "—"}</TableCell>
                        <TableCell className="font-semibold text-sm">{PKR(p.wholesale)}</TableCell>
                        <TableCell className="text-sm">{PKR(p.suggested)}</TableCell>
                        <TableCell className={`font-semibold text-sm ${p.stock === 0 ? "text-destructive" : p.stock <= p.lowStockThreshold ? "text-amber-600" : "text-primary"}`}>
                          {p.stock}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.reservedStock ?? 0}</TableCell>
                        <TableCell className="text-sm">{p.soldQty ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={p.stock > 0 && p.approvalStatus === "APPROVED" ? "default" : "destructive"} className="text-[10px]">
                            {p.stock === 0 ? "Out of Stock" : p.approvalStatus === "APPROVED" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Inventory ── */}
        {tab === "inventory" && <InventoryTab products={s.products} vendors={s.vendors} onDone={refreshData} />}

        {/* ── Bulk Import ── */}
        {tab === "import" && <BulkImportTab />}

        {/* ── KYC ── */}
        {tab === "kyc" && (
          <Card>
            <CardHeader><CardTitle>KYC Approvals</CardTitle></CardHeader>
            <CardContent>
              {s.kycRequests.filter(k => k.status === "Pending").length === 0 && <p className="text-muted-foreground text-sm py-6 text-center">No KYC requests pending.</p>}
              {s.kycRequests.filter(k => k.status === "Pending").map(k => (
                <div key={k.id} className="rounded-2xl border border-border p-4 mb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{k.name}</p>
                      <Badge variant="outline" className="text-[10px] uppercase">{k.accountType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Contact: {k.email} • {k.phone}</p>
                    {k.accountType === "vendor" && (
                      <p className="text-xs text-muted-foreground mt-0.5">Brand: {k.brandName} • Pickup: {k.pickupCity ?? "Not set"}</p>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-2 bg-surface p-2 rounded-lg border border-border inline-block space-y-0.5">
                      <p><span className="font-semibold">Bank:</span> {k.bankName ?? "—"}</p>
                      <p><span className="font-semibold">Title:</span> {k.accountName ?? "—"}</p>
                      <p><span className="font-semibold">A/C:</span> {k.accountNumber ?? "—"}</p>
                      <p><span className="font-semibold">IBAN:</span> {k.iban ?? "—"}</p>
                      {k.cnicNumber && <p><span className="font-semibold">CNIC:</span> {k.cnicNumber}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleKyc(k.id, true)} disabled={loading === k.id}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleKyc(k.id, false)} disabled={loading === k.id}>Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Unlocks ── */}
        {tab === "unlocks" && <UnlocksTab unlocks={s.unlocks ?? []} onDone={refreshData} />}

        {/* ── Payouts ── */}
        {tab === "payouts" && <PayoutsTab payouts={s.payouts ?? []} resellers={s.resellers} vendors={s.vendors} onDone={refreshData} />}

        {/* ── Audit Logs ── */}
        {tab === "audit" && <AuditLogTab />}

        {/* ── Master Ledger ── */}
        {tab === "ledger" && <MasterLedgerTab />}

        {/* ── Platform Config ── */}
        {tab === "config" && <PlatformConfigTab config={s.config} onDone={refreshData} />}
      </div>
    </DashboardLayout>
  );
}

// ── Order Status Changer ─────────────────────────────────────────────────────
function OrderStatusChanger({ orderId, currentStatus, onDone }: { orderId: string; currentStatus: string; onDone: () => void }) {
  const STATUSES = ["Pending","Confirmed","StockReserved","Packed","ReadyForPickup","Shipped","Delivered","SettlementEligible","Settled","Cancelled","ReturnRequested","Returned","RTO","FailedDelivery"];
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  const handleChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setLoading(true);
    try {
      await updateOrderStatus(orderId, newStatus, undefined, trackingId || undefined);
      await onDone();
      toast.success(`Order ${orderId} → ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <select
        value={currentStatus}
        onChange={e => handleChange(e.target.value)}
        disabled={loading}
        className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
      </select>
      {(currentStatus === "Confirmed" || currentStatus === "Packed") && (
        <input
          value={trackingId}
          onChange={e => setTrackingId(e.target.value)}
          placeholder="Tracking ID (optional)"
          className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  );
}

// ── Inventory Tab ────────────────────────────────────────────────────────────
function InventoryTab({ products, vendors, onDone }: { products: any[]; vendors: any[]; onDone: () => void }) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"receive" | "adjust" | "damage">("receive");
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [vendorFilter, setVendorFilter] = useState("");

  const filtered = vendorFilter ? products.filter(p => p.vendorId === vendorFilter) : products;

  const handleSubmit = async () => {
    if (!selectedProduct) { toast.error("Select a product"); return; }
    if (!note) { toast.error("Note is required"); return; }
    setLoading(true);
    try {
      if (action === "receive") await receiveStock(selectedProduct, qty, note);
      else if (action === "damage") await recordDamagedStock(selectedProduct, qty, note);
      else await adjustStock(selectedProduct, qty, note);
      toast.success("Inventory updated!");
      await onDone();
      setNote("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    if (!selectedProduct) { toast.error("Select a product first"); return; }
    setLoadingMovements(true);
    try {
      const data = await getStockMovements(selectedProduct);
      setMovements(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingMovements(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Stock Management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Filter by Vendor</Label>
              <select
                value={vendorFilter}
                onChange={e => setVendorFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Vendors</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.brandName}</option>)}
              </select>
            </div>
            <div>
              <Label>Product</Label>
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select product…</option>
                {filtered.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Stock: {p.stock}, Reserved: {p.reservedStock ?? 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Action</Label>
              <select
                value={action}
                onChange={e => setAction(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="receive">Receive Stock (+)</option>
                <option value="adjust">Manual Adjustment (±)</option>
                <option value="damage">Record Damaged (−)</option>
              </select>
            </div>
            <div>
              <Label>Quantity {action === "adjust" ? "(negative = reduce)" : ""}</Label>
              <Input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label>Note (required)</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Vendor delivery batch 1" className="mt-1" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving…" : "Apply"}
            </Button>
            <Button variant="outline" onClick={loadMovements} disabled={loadingMovements}>
              {loadingMovements ? "Loading…" : "View Movement History"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Stock Summary */}
      <Card>
        <CardHeader><CardTitle>Product Stock Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Physical</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const available = p.stock - (p.reservedStock ?? 0);
                  const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold text-sm max-w-[140px] truncate">{p.title}</TableCell>
                      <TableCell className="text-xs font-mono">{p.sku ?? "—"}</TableCell>
                      <TableCell className="text-xs">{vendors.find(v => v.id === p.vendorId)?.brandName ?? "—"}</TableCell>
                      <TableCell className="font-semibold">{p.stock}</TableCell>
                      <TableCell className="text-amber-600">{p.reservedStock ?? 0}</TableCell>
                      <TableCell className={available <= 0 ? "text-destructive font-bold" : "text-primary font-semibold"}>{available}</TableCell>
                      <TableCell>{p.soldQty ?? 0}</TableCell>
                      <TableCell>{p.lowStockThreshold}</TableCell>
                      <TableCell>
                        {p.stock === 0 ? <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge> :
                          isLow ? <Badge className="text-[10px] bg-amber-500">Low Stock</Badge> :
                          <Badge className="text-[10px] bg-emerald-500">OK</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Movement History */}
      {movements.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Stock Movement History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{new Date(m.createdAt).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{m.type}</Badge></TableCell>
                      <TableCell className={`font-semibold ${m.qty > 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {m.qty > 0 ? "+" : ""}{m.qty}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{m.orderId ?? "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{m.performedBy}</TableCell>
                      <TableCell className="text-xs">{m.note ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Unlocks Tab ──────────────────────────────────────────────────────────────
function UnlocksTab({ unlocks, onDone }: { unlocks: any[]; onDone: () => void }) {
  const [proofImg, setProofImg] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const handle = async (unlockId: string, approve: boolean) => {
    setLoading(unlockId);
    try {
      await processUnlockRequest(unlockId, approve, note[unlockId] || undefined);
      toast.success(approve ? "Account unlocked & Rs. 500 COD reserve credited." : "Unlock request rejected.");
      await onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>COD Security Unlock Requests</CardTitle></CardHeader>
      <CardContent>
        {unlocks.length === 0 && <p className="text-muted-foreground text-sm py-6 text-center">No unlock requests.</p>}
        {unlocks.map(u => (
          <div key={u.id} className="rounded-2xl border border-border p-5 mb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-bold">Reseller: {u.resellerId}</p>
                <p className="text-sm text-muted-foreground">TRX: <span className="font-mono">{u.trxId}</span></p>
                <p className="text-sm text-muted-foreground">Amount: <span className="font-semibold">Rs. {u.amount}</span> via {u.method}</p>
                <p className="text-xs text-muted-foreground">{new Date(u.date).toLocaleString()}</p>
                <Badge className="mt-2 text-[10px]" variant={u.status === "Approved" ? "default" : u.status === "Rejected" ? "destructive" : "outline"}>
                  {u.status}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {u.receipt && (
                  <button onClick={() => setProofImg(u.receipt)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    <Eye className="h-3.5 w-3.5" /> View Receipt
                  </button>
                )}
                {u.status === "Pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handle(u.id, true)} disabled={loading === u.id}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve & Unlock
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handle(u.id, false)} disabled={loading === u.id}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {u.status === "Pending" && (
              <div className="mt-3">
                <Label className="text-xs">Admin Note (optional)</Label>
                <Textarea
                  value={note[u.id] ?? ""}
                  onChange={e => setNote(prev => ({ ...prev, [u.id]: e.target.value }))}
                  rows={2} placeholder="Reason or note…" className="text-xs mt-1"
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
      <Dialog open={!!proofImg} onOpenChange={() => setProofImg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
          {proofImg && <img src={proofImg} alt="Receipt" className="w-full rounded-xl" />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Payouts Tab ──────────────────────────────────────────────────────────────
function PayoutsTab({ payouts, resellers, vendors, onDone }: { payouts: any[]; resellers: any[]; vendors: any[]; onDone: () => void }) {
  const [paymentRef, setPaymentRef] = useState<Record<string, string>>({});
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const getUserLabel = (p: any) => {
    if (p.resellerId) return resellers.find(r => r.id === p.resellerId)?.brandName ?? p.resellerId;
    if (p.vendorId) return vendors.find(v => v.id === p.vendorId)?.brandName ?? p.vendorId;
    return "Unknown";
  };

  const handle = async (payoutId: string, approve: boolean) => {
    setLoading(payoutId);
    try {
      await approveWithdrawal(payoutId, approve, paymentRef[payoutId] || undefined, adminNote[payoutId] || undefined);
      toast.success(approve ? "Payout approved & balance updated" : "Payout rejected & amount refunded");
      await onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Withdrawal Requests ({payouts.filter(p => p.status === "Pending").length} pending)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {payouts.length === 0 && <p className="text-muted-foreground text-sm py-6 text-center">No payout requests.</p>}
        {payouts.map(p => (
          <div key={p.id} className="rounded-2xl border border-border p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-lg">{PKR(p.amount)}</p>
                <p className="text-sm font-semibold">{getUserLabel(p)}</p>
                <p className="text-xs text-muted-foreground">{p.method} • {p.accountName} • {p.accountNumber}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.requestedAt).toLocaleString()}</p>
                {p.adminNote && <p className="text-xs text-muted-foreground mt-1">Note: {p.adminNote}</p>}
              </div>
              <div>
                <Badge variant={p.status === "Paid" ? "default" : p.status === "Rejected" ? "destructive" : "outline"} className="text-[10px]">
                  {p.status}
                </Badge>
              </div>
            </div>

            {p.status === "Pending" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Payment Reference / TRX ID</Label>
                  <Input
                    value={paymentRef[p.id] ?? ""}
                    onChange={e => setPaymentRef(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Enter your TRX reference"
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Admin Note</Label>
                  <Input
                    value={adminNote[p.id] ?? ""}
                    onChange={e => setAdminNote(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Optional note"
                    className="text-xs mt-1"
                  />
                </div>
              </div>
            )}

            {p.status === "Pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handle(p.id, true)} disabled={loading === p.id}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve & Mark Paid
                </Button>
                <Button size="sm" variant="outline" onClick={() => handle(p.id, false)} disabled={loading === p.id}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject & Refund
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Bulk Import Tab ──────────────────────────────────────────────────────────
function BulkImportTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const Papa = (await import("papaparse")).default;
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (parsed) => {
          try {
            const res = await bulkImportProducts(parsed.data as any[]);
            setResult(res);
            toast.success(`Import done: ${res.success} success, ${res.failed} failed`);
          } catch (err: any) {
            toast.error(err.message);
          } finally {
            setLoading(false);
          }
        },
        error: (err) => { toast.error("CSV error: " + err.message); setLoading(false); },
      });
    } catch (err: any) {
      toast.error(err.message); setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Bulk Product Import</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
          <UploadCloud className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="text-sm font-bold">Upload CSV File</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Columns: <code>title, category, vendor, wholesale, suggested, stock, description, images, colors, sizes</code>
          </p>
          <Button onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? "Importing…" : "Choose CSV File"}
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>
        <div className="text-center">
          <a
            href="data:text/csv;charset=utf-8,title,category,vendor,wholesale,suggested,stock,description,images,colors,sizes%0ATest Product,Electronics,,1200,1999,50,Sample description,,Black%2CWhite,S%2CM%2CL"
            download="sample_import.csv"
            className="text-xs text-primary font-semibold hover:underline"
          >↓ Download Sample CSV</a>
        </div>
        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border p-4 text-center"><p className="text-2xl font-black">{result.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><p className="text-2xl font-black text-emerald-600">{result.success}</p><p className="text-xs text-emerald-600">Imported</p></div>
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center"><p className="text-2xl font-black text-destructive">{result.failed}</p><p className="text-xs text-destructive">Failed</p></div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-bold text-destructive mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Errors</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => <p key={i} className="text-xs text-destructive">Row {err.row}: {err.error}</p>)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Audit Log Tab ────────────────────────────────────────────────────────────
function AuditLogTab() {
  const [logs, setLogs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Admin Audit Logs</CardTitle>
        <Button size="sm" variant="outline" onClick={async () => { setLoading(true); setLogs(await getAuditLogs(100)); setLoading(false); }} disabled={loading}>
          {loading ? "Loading…" : "Load Logs"}
        </Button>
      </CardHeader>
      <CardContent>
        {!logs && <p className="text-sm text-muted-foreground text-center py-6">Click "Load Logs" to fetch recent admin actions.</p>}
        {logs && logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No audit logs yet.</p>}
        {logs && logs.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono">{log.adminId}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{log.action}</Badge></TableCell>
                    <TableCell className="text-xs">{log.entity}</TableCell>
                    <TableCell className="text-xs font-mono max-w-[60px] truncate">{log.entityId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[80px] truncate">{log.prevValue ?? "—"}</TableCell>
                    <TableCell className="text-xs text-primary max-w-[80px] truncate">{log.newValue ?? "—"}</TableCell>
                    <TableCell className="text-xs">{log.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Platform Config Tab ──────────────────────────────────────────────────────
function PlatformConfigTab({ config, onDone }: { config: any; onDone: () => void }) {
  const [f, setF] = useState({
    deliveryFee: config?.deliveryFee ?? 250,
    platformFeePerOrder: config?.platformFeePerOrder ?? 100,
    vendorFeePercent: config?.vendorFeePercent ?? 60,
    resellerFeePercent: config?.resellerFeePercent ?? 40,
    minWithdrawal: config?.minWithdrawal ?? 1500,
    codReserveAmount: config?.codReserveAmount ?? 500,
    firstOrdersMonitor: config?.firstOrdersMonitor ?? 2,
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await updatePlatformConfig(f);
      toast.success("Platform config saved!");
      await onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, desc, field, min }: { label: string; desc: string; field: keyof typeof f; min?: number }) => (
    <div className="rounded-xl border border-border p-4">
      <Label className="font-bold">{label}</Label>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{desc}</p>
      <Input
        type="number"
        min={min ?? 0}
        value={f[field]}
        onChange={e => setF(prev => ({ ...prev, [field]: Number(e.target.value) }))}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">All financial amounts used in order calculations. Changes apply to new orders.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Delivery Fee (PKR)" desc="Charged per order for courier" field="deliveryFee" min={0} />
          <Field label="Platform Fee per Order (PKR)" desc="Total platform fee deducted on settlement" field="platformFeePerOrder" min={0} />
          <Field label="Vendor Fee (%)" desc="% of platform fee charged to vendor" field="vendorFeePercent" min={0} />
          <Field label="Reseller Fee (%)" desc="% of platform fee charged to reseller" field="resellerFeePercent" min={0} />
          <Field label="Minimum Withdrawal (PKR)" desc="Min amount reseller/vendor can withdraw" field="minWithdrawal" min={0} />
          <Field label="COD Reserve Amount (PKR)" desc="Rs. 500 security deposit on account lock" field="codReserveAmount" min={0} />
          <Field label="First Orders Monitor" desc="How many initial orders are monitored for COD lock" field="firstOrdersMonitor" min={1} />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-700">Fee Split Preview</p>
          <p className="text-xs text-amber-600 mt-1">
            Per settled order: Vendor charged <strong>PKR {Math.round(f.platformFeePerOrder * f.vendorFeePercent / 100)}</strong> + Reseller charged <strong>PKR {Math.round(f.platformFeePerOrder * f.resellerFeePercent / 100)}</strong> = Total PKR {f.platformFeePerOrder}
          </p>
        </div>

        <Button onClick={save} disabled={loading} className="w-full">
          {loading ? "Saving…" : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-4 text-2xl font-black">{value}</p>
    </div>
  );
}

// ── Master Ledger Tab ──────────────────────────────────────────────────────────
function MasterLedgerTab() {
  const { s } = useStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const ledger = s.ledger
    .filter(l => filter === "all" || l.tag.toLowerCase() === filter)
    .filter(l => l.resellerId?.includes(search) || l.vendorId?.includes(search) || l.id.includes(search))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPlatformFees = s.ledger.filter(l => l.tag === "Platform Fee").reduce((sum, l) => sum + Math.abs(l.amount), 0);
  const totalRtoFees = s.ledger.filter(l => l.tag === "RTO Penalty").reduce((sum, l) => sum + Math.abs(l.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Metric label="Total Platform Fees Collected" value={PKR(totalPlatformFees)} icon={TrendingUp} />
        <Metric label="Total RTO Penalties Collected" value={PKR(totalRtoFees)} icon={AlertCircle} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Global Ledger</CardTitle>
          <div className="flex items-center gap-3 mt-4">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by User ID or TXN ID..." className="max-w-xs" />
            <select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="all">All Tags</option>
              <option value="platform fee">Platform Fee</option>
              <option value="sale">Sale</option>
              <option value="reseller profit">Reseller Profit</option>
              <option value="rto penalty">RTO Penalty</option>
              <option value="payout">Payout</option>
              <option value="refund">Refund</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>TXN ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">{new Date(l.date).toLocaleString()}</TableCell>
                    <TableCell className="text-[10px] font-mono">{l.id}</TableCell>
                    <TableCell className="text-xs font-mono">{l.resellerId || l.vendorId}</TableCell>
                    <TableCell className="text-xs">{l.label}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.tag}</Badge></TableCell>
                    <TableCell className={`font-bold text-sm ${l.amount < 0 ? "text-destructive" : "text-primary"}`}>{PKR(l.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

