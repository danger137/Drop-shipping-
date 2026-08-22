"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, PlusCircle, User, MessageSquareCode,
  Upload, CheckCircle2, Clock, XCircle, Send, Bell, Paperclip, Mic, Search,
  Wallet, ShoppingCart, Download, Image as ImageIcon, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useStore, PKR, fileToDataUrl, type Vendor } from "@/lib/store";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SEED_CATEGORIES } from "@/lib/seed";

export default function VendorPage() {
  const { s, meVendor, setCurrentVendor, updateVendorProfile, submitVendorProduct, send, markNotificationsRead, isDataLoading } = useStore();
  const [tab, setTab] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    if (isDataLoading) return;
    if (s.role === "guest") {
      router.replace("/login");
    } else if (s.role !== "vendor" && s.role !== "admin") {
      router.replace("/app");
    }
  }, [s.role, isDataLoading, router]);

  // My products = products with vendorId === current vendor
  const myProducts = useMemo(() =>
    !meVendor ? [] : s.products.filter(p => p.vendorId === meVendor.id && p.approvalStatus !== "DELETED" && p.rejectionReason !== "Deleted by vendor"),
    [s.products, meVendor?.id]
  );

  const approvedCount = myProducts.filter(p => p.approvalStatus === "APPROVED").length;
  const pendingCount = myProducts.filter(p => p.approvalStatus === "PENDING_ADMIN_APPROVAL").length;
  const rejectedCount = myProducts.filter(p => p.approvalStatus === "REJECTED").length;

  const myVendorOrders = useMemo(() => {
    if (!meVendor) return [];
    return s.orders.filter(o => {
      const p = s.products.find(x => x.id === o.productId);
      return p && p.vendorId === meVendor.id;
    });
  }, [s.orders, s.products, meVendor?.id]);

  const vendorSales = !meVendor ? 0 : s.ledger.filter(l => l.vendorId === meVendor.id && l.tag === "Sale").reduce((a, b) => a + b.amount, 0);

  // Notifications for this vendor
  const myNotifs = !meVendor ? [] : s.notifications.filter(n => n.target === meVendor.id);
  const unreadNotifs = myNotifs.filter(n => !n.read).length;

  // Messages for this vendor
  const myMessages = !meVendor ? [] : s.messages.filter(m => m.resellerId === meVendor.id);

  const pendingKycCount = 0; // not used here but required for sidebar badge type

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "My Products", icon: Package, badge: pendingCount },
    { id: "add-product", label: "Add Product", icon: PlusCircle },
    { id: "orders", label: `Vendor Orders (${myVendorOrders.length})`, icon: ShoppingCart },
    { id: "wallet", label: "Wallet & Payouts", icon: Wallet },
    { id: "profile", label: "My Profile", icon: User },
    { id: "chat", label: "Support Chat", icon: MessageSquareCode, badge: unreadNotifs },
  ];

  if (s.role === "guest" || (s.role !== "vendor" && s.role !== "admin") || !meVendor) {
    return null;
  }

  return (
    <DashboardLayout
      title="Vendor Portal"
      role="vendor"
      items={sidebarItems}
      activeItem={tab}
      onItemChange={setTab}
    >
      {tab === "dashboard" && <VendorDashboard myProducts={myProducts} approvedCount={approvedCount} pendingCount={pendingCount} rejectedCount={rejectedCount} meVendor={meVendor} vendorSales={vendorSales} myVendorOrders={myVendorOrders} />}
      {tab === "products" && <VendorProducts myProducts={myProducts} />}
      {tab === "add-product" && <AddProductForm meVendor={meVendor} onSuccess={() => setTab("products")} />}
      {tab === "orders" && <VendorOrders myVendorOrders={myVendorOrders} />}
      {tab === "wallet" && <VendorWallet vendorSales={vendorSales} />}
      {tab === "profile" && <VendorProfile meVendor={meVendor} />}
      {tab === "chat" && <VendorChat messages={myMessages} meVendor={meVendor} onMarkRead={() => markNotificationsRead(meVendor.id)} />}
    </DashboardLayout>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function VendorDashboard({ myProducts, approvedCount, pendingCount, rejectedCount, meVendor, vendorSales, myVendorOrders }: {
  myProducts: any[]; approvedCount: number; pendingCount: number; rejectedCount: number; meVendor: Vendor; vendorSales: number; myVendorOrders: any[];
}) {
  const { s } = useStore();

  return (
    <div className="space-y-6">
      {/* ─── Dashboard Hero Banner ─────────────────────── */}
      <div
        className="relative mb-6 rounded-3xl overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1400&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-charcoal/85" />

        <div className="relative z-10 px-6 pt-8 pb-6 md:px-10 md:pt-10">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Welcome back</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-black text-white">{meVendor.brandName} 👋</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="bg-white p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Sales Earnings</p>
                <p className="text-3xl font-black text-primary mt-1">{PKR(vendorSales)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="bg-white p-5 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wallet Balance</p>
                <p className="text-3xl font-black text-charcoal mt-1">{PKR(meVendor.balance)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-charcoal/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-charcoal" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-border/60 bg-white p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Vendor Orders</p>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-black text-charcoal">{myVendorOrders.length}</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-white p-5 card-shadow">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-4 text-3xl font-black text-emerald-600">{approvedCount}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Live / Approved Products</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-white p-5 card-shadow">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-3xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Awaiting Admin Approval</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-background card-shadow">
        <div className="p-5 border-b border-border/60">
          <h3 className="text-lg font-black text-charcoal">Recent Products</h3>
        </div>
        <div className="divide-y divide-border/40">
          {myProducts.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4">
              <img src={p.images[0]} alt={p.title} className="h-12 w-12 rounded-xl object-cover border border-border" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">Wholesale: {PKR(p.wholesale)}</p>
              </div>
              <ApprovalBadge status={p.approvalStatus} />
            </div>
          ))}
          {myProducts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No products yet. Click "Add Product" to get started.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function VendorProducts({ myProducts }: { myProducts: any[] }) {
  const { s, requestProductDelete } = useStore();
  const [q, setQ] = useState("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const list = myProducts.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-border bg-background p-5 md:p-6 card-shadow">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 bg-surface" placeholder="Search my products..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <span className="text-xs font-semibold text-muted-foreground">{list.length} Products Submitted</span>
        </div>
      </div>

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
                  <TableHead className="text-right w-[140px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No matching products found.</TableCell>
                  </TableRow>
                ) : (
                  list.map((p) => (
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
                        <div className="flex flex-col">
                          <span className="font-semibold text-charcoal">{p.stock} units</span>
                          {p.stock <= (p.lowStockThreshold ?? 5) && (
                            <span className="text-[10px] font-bold text-destructive">Low Stock</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <ApprovalBadge status={p.approvalStatus} />
                        {s.productActionRequests.some(r => r.productId === p.id && r.status === "PENDING" && r.type === "EDIT") && (
                          <Badge variant="outline" className="text-[10px] mt-1 border-primary text-primary">Pending Edit</Badge>
                        )}
                        {s.productActionRequests.some(r => r.productId === p.id && r.status === "PENDING" && r.type === "DELETE") && (
                          <Badge variant="outline" className="text-[10px] mt-1 border-destructive text-destructive">Pending Delete</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProduct(p)}
                            disabled={s.productActionRequests.some(r => r.productId === p.id && r.status === "PENDING")}
                            className="h-8 w-8 hover:text-primary"
                          >
                            <MessageSquareCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingProductId(p.id)}
                            disabled={s.productActionRequests.some(r => r.productId === p.id && r.status === "PENDING")}
                            className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product: {editingProduct.title}</DialogTitle>
            </DialogHeader>
            <AddProductForm
              meVendor={s.vendors.find(v => v.id === editingProduct.vendorId) || ({} as any)}
              onSuccess={() => setEditingProduct(null)}
              initialData={editingProduct}
            />
          </DialogContent>
        </Dialog>
      )}

      {deletingProductId && (
        <Dialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Product Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground">
              Are you sure you want to delete this product? This will send a deletion request to the admin for approval.
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingProductId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                await requestProductDelete(deletingProductId);
                setDeletingProductId(null);
              }}>Request Deletion</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AddProductForm({ meVendor, onSuccess, initialData }: { meVendor: Vendor; onSuccess: () => void; initialData?: any }) {
  const { submitVendorProduct, requestProductEdit, s } = useStore();
  const [title, setTitle] = useState(initialData?.title || "");
  const [desc, setDesc] = useState(initialData?.description || "");
  const [wholesale, setWholesale] = useState(initialData?.wholesale?.toString() || "");
  const [suggested, setSuggested] = useState(initialData?.suggested?.toString() || "");
  const [minSellingPrice, setMinSellingPrice] = useState(initialData?.minSellingPrice?.toString() || "");
  const [stock, setStock] = useState(initialData?.stock?.toString() || "");
  const [weight, setWeight] = useState(initialData?.weight?.toString() || "");
  const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.lowStockThreshold?.toString() || "5");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || s.categories[0]?.id || "");
  const [colors, setColors] = useState<string[]>(initialData?.colors || []);
  const [colorPricing, setColorPricing] = useState<Record<string, number>>(initialData?.colorPricing || {});
  const [colorImages, setColorImages] = useState<Record<string, string>>(initialData?.colorImages || {});
  const [sizes, setSizes] = useState<string[]>(initialData?.sizes || []);
  const [sizePricing, setSizePricing] = useState<Record<string, number>>(initialData?.sizePricing || {});
  const [hook, setHook] = useState(initialData?.hook || "");
  const [colorInput, setColorInput] = useState("");
  const [colorPriceInput, setColorPriceInput] = useState<number>(0);
  const [sizeInput, setSizeInput] = useState("");
  const [sizePriceInput, setSizePriceInput] = useState<number>(0);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setLoading(true);
    try {
      const urls = await Promise.all(files.map(f => fileToDataUrl(f)));
      setImages(prev => [...prev, ...urls].slice(0, 5));
    } catch { toast.error("Failed to read images."); }
    setLoading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setVideoLoading(true);
    try {
      const url = await fileToDataUrl(f);
      setVideoUrl(url);
    } catch { toast.error("Failed to read video."); }
    setVideoLoading(false);
  };

  const addChip = (field: "colors" | "sizes", name: string, price: number) => {
    const v = name.trim();
    if (!v) return;
    if (field === "colors" && !colors.includes(v)) {
      setColors(prev => [...prev, v]);
      if (price > 0) setColorPricing(prev => ({ ...prev, [v]: price }));
      setColorInput("");
      setColorPriceInput(0);
    } else if (field === "sizes" && !sizes.includes(v)) {
      setSizes(prev => [...prev, v]);
      if (price > 0) setSizePricing(prev => ({ ...prev, [v]: price }));
      setSizeInput("");
      setSizePriceInput(0);
    }
  };

  const removeChip = (field: "colors" | "sizes", val: string) => {
    if (field === "colors") {
      setColors(prev => prev.filter(x => x !== val));
      const cp = { ...colorPricing };
      delete cp[val];
      setColorPricing(cp);
      const ci = { ...colorImages };
      delete ci[val];
      setColorImages(ci);
    } else {
      setSizes(prev => prev.filter(x => x !== val));
      const sp = { ...sizePricing };
      delete sp[val];
      setSizePricing(sp);
    }
  };

  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, colorName: string) => {
    const f = e.target.files?.[0];
    if (f) {
      try {
        const url = await fileToDataUrl(f);
        setColorImages(prev => ({ ...prev, [colorName]: url }));
      } catch {
        toast.error("Failed to read image.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !wholesale || !suggested || !weight || images.length === 0) {
      return toast.error("Title, pricing, weight, and at least one image are required.");
    }
    setLoading(true);
    const productData = {
      title,
      description: desc,
      wholesale: parseFloat(wholesale),
      suggested: parseFloat(suggested),
      minSellingPrice: minSellingPrice ? parseFloat(minSellingPrice) : undefined,
      stock: parseInt(stock) || 0,
      weight: parseFloat(weight),
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      categoryId,
      colors,
      colorPricing,
      colorImages,
      sizes,
      sizePricing,
      hook,
      images,
      videoUrl,
      vendorId: meVendor.id
    };

    if (initialData) {
      await requestProductEdit(initialData.id, productData);
      toast.success("Edit request submitted for admin approval!");
    } else {
      await submitVendorProduct(productData);
      toast.success("Product submitted for admin approval!");
    }
    
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background card-shadow">
      <div className="p-5 border-b border-border/60">
        <h3 className="text-lg font-black text-charcoal">Submit New Product</h3>
        <p className="text-xs text-muted-foreground">Products will be reviewed by the admin before going live.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label>Product Title</Label>
            <Input required value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" placeholder="e.g. Premium Leather Wallet" />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} className="mt-1.5" rows={3} placeholder="Describe your product..." />
          </div>
          <div>
            <Label>Wholesale Price (PKR)</Label>
            <Input required type="number" value={wholesale} onChange={e => setWholesale(e.target.value)} className="mt-1.5" placeholder="e.g. 1200" />
          </div>
          <div>
            <Label>Suggested Selling Price (PKR)</Label>
            <Input required type="number" value={suggested} onChange={e => setSuggested(e.target.value)} className="mt-1.5" placeholder="e.g. 2000" />
          </div>
          <div>
            <Label>Minimum Selling Price (PKR)</Label>
            <Input type="number" value={minSellingPrice} onChange={e => setMinSellingPrice(e.target.value)} className="mt-1.5" placeholder="e.g. 1500" />
          </div>
          <div>
            <Label>Stock Quantity</Label>
            <Input type="number" value={stock} onChange={e => setStock(e.target.value)} className="mt-1.5" placeholder="e.g. 100" />
          </div>
          <div>
            <Label>Low Stock Alert Threshold</Label>
            <Input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} className="mt-1.5" placeholder="e.g. 5" />
          </div>
          <div>
            <Label>Weight (grams) <span className="text-destructive">*</span></Label>
            <Input required type="number" value={weight} onChange={e => setWeight(e.target.value)} className="mt-1.5" placeholder="e.g. 500" />
          </div>
          <div>
            <Label>Category</Label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1.5 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/40">
              {s.categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <Label className="text-xs">Colors <span className="text-muted-foreground font-normal">(leave empty = no color option shown)</span></Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={colorInput} onChange={(e) => setColorInput(e.target.value)} placeholder="Color name e.g. Black" className="flex-1" />
                <Input type="number" value={colorPriceInput || ""} onChange={(e) => setColorPriceInput(Number(e.target.value))} placeholder="Price (PKR)" className="w-32" />
                <Button type="button" variant="outline" onClick={() => addChip("colors", colorInput, colorPriceInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.length === 0 && <span className="text-xs text-muted-foreground">No colors added — color dropdown won't show on order form.</span>}
                {colors.map((c) => (
                  <div key={c} className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between gap-4 w-full max-w-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-charcoal">{c}</span>
                      {colorPricing[c] ? <span className="text-xs text-muted-foreground">PKR {colorPricing[c]}</span> : <span className="text-xs text-muted-foreground">Standard Price</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="relative h-10 w-10 border border-border/60 bg-white rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden shrink-0">
                        {colorImages[c] ? <img src={colorImages[c]} className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleColorImageUpload(e, c)} />
                      </label>
                      <button type="button" onClick={() => removeChip("colors", c)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Sizes <span className="text-muted-foreground font-normal">(leave empty = no size option shown)</span></Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} placeholder="Size name e.g. S / M / L" className="flex-1" />
                <Input type="number" value={sizePriceInput || ""} onChange={(e) => setSizePriceInput(Number(e.target.value))} placeholder="Price (PKR)" className="w-32" />
                <Button type="button" variant="outline" onClick={() => addChip("sizes", sizeInput, sizePriceInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {sizes.length === 0 && <span className="text-xs text-muted-foreground">No sizes added — size dropdown won't show on order form.</span>}
                {sizes.map((s) => (
                  <div key={s} className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between gap-4 max-w-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-charcoal">{s}</span>
                      {sizePricing[s] ? <span className="text-xs text-muted-foreground">PKR {sizePricing[s]}</span> : <span className="text-xs text-muted-foreground">Standard Price</span>}
                    </div>
                    <button type="button" onClick={() => removeChip("sizes", s)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Sales Hook / Tagline</Label>
            <Input value={hook} onChange={e => setHook(e.target.value)} className="mt-1.5" placeholder="e.g. Best quality at unbeatable price!" />
          </div>
          <div className="md:col-span-1">
            <Label>Product Images (up to 5)</Label>
            <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border/60 bg-surface h-32 cursor-pointer hover:border-primary transition-colors rounded-xl">
              {loading ? <span className="text-sm text-muted-foreground">Uploading...</span> : (
                <div className="text-center"><Upload className="h-6 w-6 mx-auto text-muted-foreground" /><span className="text-xs text-muted-foreground mt-2 block">Click to upload images</span></div>
              )}
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
            </label>
            {images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} className="h-16 w-16 object-cover rounded-xl border border-border" />
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-1">
            <Label>Product Video (Optional)</Label>
            <label className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-border/60 bg-surface h-32 cursor-pointer hover:border-primary transition-colors rounded-xl">
              {videoLoading ? <span className="text-sm text-muted-foreground">Uploading...</span> : (
                <div className="text-center"><Upload className="h-6 w-6 mx-auto text-muted-foreground" /><span className="text-xs text-muted-foreground mt-2 block">Click to upload video</span></div>
              )}
              <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
            </label>
            {videoUrl && (
              <div className="relative mt-3 inline-block w-48">
                <video src={videoUrl} className="w-full aspect-video object-contain bg-black rounded-xl border border-border" controls />
                <button type="button" onClick={() => setVideoUrl("")} className="absolute -top-2 -right-2 z-10 h-6 w-6 bg-destructive hover:bg-destructive/90 text-white rounded-full shadow-md text-xs flex items-center justify-center transition-transform hover:scale-105">✕</button>
              </div>
            )}
          </div>
        </div>
        <Button type="submit" className="w-full h-12 text-base font-bold">
          Submit for Admin Approval
        </Button>
      </form>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────────
// ─── Profile Tab ─────────────────────────────────────────────────────────────────
function VendorProfile({ meVendor }: { meVendor: Vendor }) {
  const { refreshData } = useStore();
  const [brandName, setBrandName] = useState(meVendor.brandName);
  const [name, setName] = useState(meVendor.name || "");
  const [phone, setPhone] = useState(meVendor.phone);
  const [email, setEmail] = useState(meVendor.email || "");
  const [ownerName, setOwnerName] = useState(meVendor.ownerName || "");
  const [cnicNumber, setCnicNumber] = useState(meVendor.cnicNumber || "");
  const [businessAddress, setBusinessAddress] = useState(meVendor.businessAddress || "");
  // Pickup
  const [pickupPersonName, setPickupPersonName] = useState(meVendor.pickupPersonName || "");
  const [pickupPhone, setPickupPhone] = useState(meVendor.pickupPhone || "");
  const [pickupAddress, setPickupAddress] = useState(meVendor.pickupAddress || "");
  const [pickupCity, setPickupCity] = useState(meVendor.pickupCity || "");
  // Return
  const [returnAddress, setReturnAddress] = useState(meVendor.returnAddress || "");
  const [returnCity, setReturnCity] = useState(meVendor.returnCity || "");
  const [returnContact, setReturnContact] = useState(meVendor.returnContact || "");
  const [returnPhone, setReturnPhone] = useState(meVendor.returnPhone || "");
  // Bank
  const [brandLogo, setBrandLogo] = useState<string | null>(meVendor.brandLogo);
  const [bankName, setBankName] = useState(meVendor.bankName);
  const [accountName, setAccountName] = useState(meVendor.accountName);
  const [accountNumber, setAccountNumber] = useState(meVendor.accountNumber);
  const [iban, setIban] = useState(meVendor.iban || "");
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // Keep form in sync when meVendor changes (after refresh)
  const prevId = meVendor.id;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoUploading(true);
    try {
      const url = await fileToDataUrl(f);
      setBrandLogo(url);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) { toast.error("Brand name is required"); return; }
    setLoading(true);
    try {
      const { updateVendorProfileAction } = await import("@/actions/profile");
      await updateVendorProfileAction({
        brandName,
        name,
        phone,
        email,
        ownerName,
        cnicNumber,
        businessAddress,
        pickupPersonName,
        pickupPhone,
        pickupAddress,
        pickupCity,
        returnAddress,
        returnCity,
        returnContact,
        returnPhone,
        brandLogo: brandLogo ?? "",
        bankName,
        accountName,
        accountNumber,
        iban,
      });
      await refreshData();
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background card-shadow">
      <div className="p-5 border-b border-border/60">
        <h3 className="text-lg font-black text-charcoal">My Vendor Profile</h3>
        <p className="text-xs text-muted-foreground">Update your brand information and bank details.</p>
      </div>
      <form onSubmit={handleSave} className="p-6 space-y-6">
        {/* Logo upload */}
        <div className="flex items-center gap-5">
          <label className="cursor-pointer relative group">
            <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-border bg-surface flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
              {logoUploading ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-[10px] text-muted-foreground">Uploading…</span>
                </div>
              ) : brandLogo ? (
                <img src={brandLogo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Upload logo</span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </label>
          <div>
            <p className="font-black text-xl text-charcoal">{brandName || meVendor.brandName}</p>
            <p className="text-xs text-muted-foreground">Vendor ID: {meVendor.id}</p>
            <p className="text-xs text-muted-foreground mt-1">Click image to change logo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 pb-2 border-b border-border/60"><h4 className="font-bold text-charcoal">Business Info</h4></div>
          <div>
            <Label>Brand / Business Name <span className="text-destructive">*</span></Label>
            <Input value={brandName} onChange={e => setBrandName(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <Label>Company / Legal Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Owner Name</Label>
            <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>CNIC Number</Label>
            <Input value={cnicNumber} onChange={e => setCnicNumber(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>Business Address</Label>
            <Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} className="mt-1.5" />
          </div>

          <div className="md:col-span-2 pb-2 border-b border-border/60 mt-4"><h4 className="font-bold text-charcoal">Pickup Address (For Couriers)</h4></div>
          <div>
            <Label>Pickup Contact Name</Label>
            <Input value={pickupPersonName} onChange={e => setPickupPersonName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Pickup Phone</Label>
            <Input value={pickupPhone} onChange={e => setPickupPhone(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Pickup City</Label>
            <Input value={pickupCity} onChange={e => setPickupCity(e.target.value)} className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>Pickup Full Address</Label>
            <Input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} className="mt-1.5" />
          </div>

          <div className="md:col-span-2 pb-2 border-b border-border/60 mt-4"><h4 className="font-bold text-charcoal">Return Address (For RTOs)</h4></div>
          <div>
            <Label>Return Contact Name</Label>
            <Input value={returnContact} onChange={e => setReturnContact(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Return Phone</Label>
            <Input value={returnPhone} onChange={e => setReturnPhone(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Return City</Label>
            <Input value={returnCity} onChange={e => setReturnCity(e.target.value)} className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>Return Full Address</Label>
            <Input value={returnAddress} onChange={e => setReturnAddress(e.target.value)} className="mt-1.5" />
          </div>

          <div className="md:col-span-2 pb-2 border-b border-border/60 mt-4"><h4 className="font-bold text-charcoal">Bank Details</h4></div>
          <div>
            <Label>Bank Name</Label>
            <Input value={bankName} onChange={e => setBankName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Account Title</Label>
            <Input value={accountName} onChange={e => setAccountName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Account Number</Label>
            <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>IBAN</Label>
            <Input value={iban} onChange={e => setIban(e.target.value)} className="mt-1.5" />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 font-bold" disabled={loading || logoUploading}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

// ─── Chat Tab ────────────────────────────────────────────────────────────────────
function VendorChat({ messages, meVendor, onMarkRead }: { messages: any[]; meVendor: Vendor; onMarkRead: () => void }) {
  const { send } = useStore();
  const [msg, setMsg] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    send(meVendor.id, "vendor", msg.trim());
    setMsg("");
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background card-shadow flex flex-col h-[70vh]">
      <div className="p-5 border-b border-border/60 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-charcoal">Support Chat</h3>
          <p className="text-xs text-muted-foreground">Chat directly with the PakDropship admin team.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onMarkRead}>Mark all read</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No messages yet. Say hello! 👋</p>}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.from === "admin" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${m.from === "admin" ? "bg-muted text-charcoal rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"}`}>
              {m.text && <p className="break-words">{m.text}</p>}
              {m.attachmentType === 'image' && m.attachmentUrl && <img src={m.attachmentUrl} className="mt-2 rounded-xl max-w-full h-auto max-h-48 object-cover shadow-sm border border-black/10" alt="Attached" />}
              {m.attachmentType === 'audio' && m.attachmentUrl && <audio src={m.attachmentUrl} controls className="mt-2 w-full max-w-[200px] h-8" />}
              {m.attachmentType === 'pdf' && m.attachmentUrl && <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-1 block font-bold">📄 View PDF Document</a>}
              <p className={`text-[10px] mt-1 ${m.from === "admin" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>{new Date(m.at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-border/60 flex items-center gap-2 sm:gap-3">
        <label className="cursor-pointer shrink-0">
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await fileToDataUrl(f);
            const type = f.type.includes("pdf") ? "pdf" : "image";
            send(meVendor.id, "vendor", "", url, type);
          }} />
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface hover:bg-surface/80 text-muted-foreground transition-colors">
            <Paperclip className="h-5 w-5" />
          </div>
        </label>
        <button type="button" className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-surface hover:bg-surface/80 text-muted-foreground transition-colors" onClick={() => {
          send(meVendor.id, "vendor", "", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "audio");
          toast.success("Voice note sent!");
        }}>
          <Mic className="h-5 w-5" />
        </button>
        <Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type a message..." className="flex-1 py-5" />
        <Button type="submit" size="icon" className="shrink-0 h-10 w-10 rounded-xl" disabled={!msg.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function ApprovalBadge({ status }: { status?: string }) {
  if (status === "APPROVED") return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">✓ Approved</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">✗ Rejected</Badge>;
  return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">⏳ Pending Review</Badge>;
}

// ─── Vendor Orders Tab ──────────────────────────────────────────────────────────
function VendorOrders({ myVendorOrders }: { myVendorOrders: any[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background card-shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Customer City</TableHead>
            <TableHead>Wholesale Earning</TableHead>
            <TableHead>Tracking Number</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {myVendorOrders.length === 0 && (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No orders yet for your products.</TableCell></TableRow>
          )}
          {myVendorOrders.map((o) => (
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
              <TableCell>{o.city}</TableCell>
              <TableCell className="font-semibold text-primary">{PKR(o.wholesale)}</TableCell>
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
                <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  o.status === 'Delivered' ? 'bg-primary text-primary-foreground' : 
                  o.status === 'Returned' ? 'bg-destructive text-destructive-foreground' :
                  'bg-blue-100 text-blue-700'
                }`}>{o.status}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Vendor Wallet Tab ──────────────────────────────────────────────────────────
function VendorWallet({ vendorSales }: { vendorSales: number }) {
  const { s, meVendor, requestPayout } = useStore();
  const ledger = s.ledger.filter((l) => l.vendorId === meVendor.id);
  const payouts = s.payouts.filter((p) => p.vendorId === meVendor.id);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ amount: 1500, method: "Bank Transfer", accountName: meVendor.accountName, accountNumber: meVendor.accountNumber });
  const minWithdrawal = s.config?.minWithdrawal ?? 1500;
  const canWithdraw = meVendor.balance >= minWithdrawal;
  const [proofView, setProofView] = useState<string | null>(null);
  const totalEarnings = ledger.filter(l => l.amount > 0).reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Available Balance</p>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className={`mt-2 text-2xl font-black ${meVendor.balance < 0 ? "text-destructive" : "text-primary"}`}>{PKR(meVendor.balance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Pending Settlement</p>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{PKR(meVendor.pendingBalance ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Orders in transit</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Earnings</p>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{PKR(vendorSales)}</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime sales settled</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Withdrawn</p>
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-black text-charcoal">{PKR(meVendor.totalWithdrawn ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime payouts</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 card-shadow">
        <Button className="w-full" disabled={!canWithdraw} onClick={() => setOpen(true)}>
          {canWithdraw ? "Request Withdrawal" : `Minimum withdrawal is ${PKR(minWithdrawal)}`}
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
                    <button onClick={() => setProofView(l.proof!)} className="flex items-center gap-1 text-xs font-semibold text-primary">
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
                <TableCell>{p.proof ? <button onClick={() => setProofView(p.proof!)} className="text-xs font-semibold text-primary">View / Download</button> : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Vendor Payout</DialogTitle></DialogHeader>
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
                if (f.amount > meVendor.balance) { toast.error("Amount exceeds wallet balance"); return; }
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
    </div>
  );
}
