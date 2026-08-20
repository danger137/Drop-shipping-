'use client';
import { useEffect, useState } from "react";
import {
  ArrowRight, PackageCheck, Truck, Wallet, MousePointerClick, ShieldCheck,
  Headphones, MapPin, Facebook, Instagram, Youtube,
  HelpCircle, Users, GraduationCap, Star, Store, Package, Globe,
  CreditCard, BarChart3, Zap, Shield, Smartphone,
} from "lucide-react";
import { useStore, PKR } from "@/lib/store";
import { IMG } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return <Landing />;
}

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  useEffect(() => {
    const observe = () => {
      const els = document.querySelectorAll<HTMLElement>(
        ".reveal, .reveal-left, .reveal-right, .reveal-scale"
      );
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      els.forEach((el) => io.observe(el));
      return io;
    };
    const io = observe();
    return () => io.disconnect();
  }, []);
}

const SLIDES = [
  {
    img: IMG("photo-1553413077-190dd305871c", 1600),
    kicker: "Sell Without Inventory",
    title: "Start Your Dropshipping Business Today",
    sub: "Connect with verified suppliers across Pakistan. Sell nationwide with COD — no stock, no warehouse needed.",
  },
  {
    img: IMG("photo-1566576912321-d58ddd7a6088", 1600),
    kicker: "Vendor-Powered Fulfillment",
    title: "Vendors Ship Directly to Your Customers",
    sub: "Vendors upload products, you set your selling price, PakDropship manages the process end-to-end.",
  },
  {
    img: IMG("photo-1587293852726-70cdb56c2866", 1600),
    kicker: "Transparent Earnings",
    title: "Withdraw Your Profit From PKR 1,500",
    sub: "Clear wallet ledger with payment proof attached to every payout. Your profit, your rules.",
  },
];

const HOW_IT_WORKS = [
  { icon: MousePointerClick, t: "Pick Product", d: "Browse the catalog and choose winning products at wholesale cost from verified vendors." },
  { icon: Wallet, t: "Set Selling Price", d: "You decide the COD amount your customer pays. The difference is your profit." },
  { icon: PackageCheck, t: "Place Order", d: "Submit the order — customer name, city, address and COD amount. That's it." },
  { icon: Truck, t: "Vendor Ships, You Profit", d: "Vendor dispatches from their location via PakDropship's courier network. Profit credited to your wallet." },
];

const RESELLER_BENEFITS = [
  { icon: Package, title: "Zero Inventory", desc: "No stock to buy or store. Sell products without any upfront investment." },
  { icon: Store, title: "Ready Products", desc: "Thousands of products from verified vendors ready to sell immediately." },
  { icon: Wallet, title: "Wholesale Pricing", desc: "Access real wholesale prices directly from vendors across Pakistan." },
  { icon: BarChart3, title: "Set Your Own Price", desc: "You decide the selling price. Your margin, your business, your profit." },
  { icon: Truck, title: "Multiple Couriers", desc: "Compare rates from Trax, PostEx, Leopards — choose the best option." },
  { icon: CreditCard, title: "COD Nationwide", desc: "Cash on Delivery across all cities in Pakistan. Customers pay on receipt." },
  { icon: Globe, title: "Shopify Integration", desc: "Connect your Shopify store and push products with one click." },
  { icon: Shield, title: "Profit Management", desc: "Transparent wallet with complete ledger, real-time profit tracking." },
];

const VENDOR_BENEFITS = [
  { icon: Package, title: "Upload Products Once", desc: "List your products and reach multiple resellers selling across Pakistan." },
  { icon: Users, title: "Reach Resellers", desc: "Your products become available to our growing network of active resellers." },
  { icon: ShieldCheck, title: "Vendor-Based Pickup", desc: "Couriers pick up from YOUR address. No need to ship to a warehouse." },
  { icon: Zap, title: "Stock Management", desc: "Real-time stock tracking, low stock alerts, and inventory management." },
  { icon: Truck, title: "Courier Integration", desc: "PakDropship's master courier account handles all shipments for you." },
  { icon: Wallet, title: "Settlement Tracking", desc: "Track every order settlement, view earnings, and withdraw easily." },
];

const FLIP = [
  {
    img: IMG("photo-1505740420928-5e560c06d30e"),
    t: "TWS Earbuds",
    b: "Trending gadget with high margins. Popular across Pakistan with strong repeat orders.",
  },
  {
    img: IMG("photo-1523275335684-37898b6baf30"),
    t: "Chrono Watches",
    b: "Gift-season hero product. Premium packaging with high perceived value.",
  },
  {
    img: IMG("photo-1596462502278-27bfdc403348"),
    t: "Beauty & Skincare",
    b: "Repeat-order category with the highest retention. Low weight = affordable shipping.",
  },
  {
    img: IMG("photo-1542291026-7eec264c27ff"),
    t: "Footwear",
    b: "Size variants managed by vendors. Strong demand year-round across all cities.",
  },
];

const FAQS: [string, string][] = [
  ["How does PakDropship work?", "PakDropship connects resellers with verified vendors. Vendors upload products, resellers sell them at their own price, vendors ship directly to customers via PakDropship's courier network, and profits are credited to your wallet."],
  ["Do I need inventory to start?", "No. You never buy or store stock. When you get a customer order, the vendor ships directly from their location. You only pay the wholesale cost after the order is placed."],
  ["How does vendor pickup work?", "Each vendor has their own pickup address. When an order is placed, the courier picks up from the vendor's location automatically — no central warehouse involved."],
  ["How is the courier fee calculated?", "Courier rates are based on pickup city, destination city, package weight, and COD amount. At checkout, you see real-time rates from multiple couriers like Trax, PostEx, and Leopards."],
  ["Which couriers are available?", "We work with Trax, PostEx, Leopards, and more. You can compare rates and choose the best option at checkout for each order."],
  ["What happens if the customer refuses delivery?", "If a parcel is returned (RTO), a handling fee is deducted from your wallet as per the RTO policy. The product returns to the vendor."],
  ["When do I receive my profit?", "Profit is credited to your wallet after successful delivery and settlement. You can withdraw once your balance reaches PKR 1,500."],
  ["How do I connect my Shopify store?", "Go to Integrations → Shopify in your reseller dashboard. Enter your store domain, authenticate, and push products to your store with one click."],
  ["How do I become a vendor?", "Register as a vendor, complete your KYC, set up your pickup address, and start uploading products. Once approved by admin, your products go live."],
  ["How do withdrawals work?", "Submit a withdrawal request from your wallet when balance exceeds PKR 1,500. Admin processes it via Bank/EasyPaisa/JazzCash with payment proof."],
];

/* ── Gallery rows for marquee ── */
const GALLERY_ROW1 = [
  IMG("photo-1552664730-d307ca884978", 500),
  IMG("photo-1511578314322-379afb476865", 500),
  IMG("photo-1540575467063-178a50c2df87", 500),
  IMG("photo-1515187029135-18ee286d815b", 500),
  IMG("photo-1529156069898-49953e39b3ac", 500),
  IMG("photo-1556761175-b413da4baf72", 500),
  IMG("photo-1497366216548-37526070297c", 500),
];

const GALLERY_ROW2 = [
  IMG("photo-1553413077-190dd305871c", 500),
  IMG("photo-1566576912321-d58ddd7a6088", 500),
  IMG("photo-1586528116311-ad8dd3c8310d", 500),
  IMG("photo-1578575437130-527eed3abbec", 500),
  IMG("photo-1607082348824-0a96f2a4b9da", 500),
  IMG("photo-1601924994987-69e26d50dc26", 500),
  IMG("photo-1494412574643-ff11b0a5c1c3", 500),
];

/* ── Trending products ── */
const TRENDING = [
  { img: IMG("photo-1596462502278-27bfdc403348", 400), title: "Flawless Eyebrow Hair Remover", rating: 4, price: "PKR 1,299" },
  { img: IMG("photo-1558618666-fcd25c85cd64", 400), title: "Mini Rechargeable Vacuum Cleaner", rating: 4.5, price: "PKR 1,899" },
  { img: IMG("photo-1570222094114-d054a817e56b", 400), title: "Mini Portable Electric Juicer", rating: 4, price: "PKR 2,199" },
  { img: IMG("photo-1526170375885-4d8ecf77b99f", 400), title: "Wood Seasoning Beewax", rating: 3.5, price: "PKR 899" },
  { img: IMG("photo-1505740420928-5e560c06d30e", 400), title: "TWS Wireless Earbuds", rating: 5, price: "PKR 2,499" },
  { img: IMG("photo-1523275335684-37898b6baf30", 400), title: "Chrono Steel Wristwatch", rating: 4, price: "PKR 3,299" },
];

const SUPPORT_CARDS = [
  {
    icon: HelpCircle,
    title: "Help Center",
    desc: "Access official PakDropship guidelines, policies, FAQs, and step-by-step instructions to run your dropshipping business smoothly.",
    cta: "Get Help",
  },
  {
    icon: Users,
    title: "Connect With Us",
    desc: "Find all PakDropship social media platforms in one place and stay connected with latest news, updates, and exclusive content.",
    cta: "Visit",
  },
  {
    icon: GraduationCap,
    title: "Learning Library",
    desc: "Explore PakDropship features, tools, courses, tutorials, and step-by-step guides to grow as a dropshipper.",
    cta: "Explore",
  },
];

/* ── Star rating component ── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i;
        const half = !filled && rating >= i - 0.5;
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${filled ? "fill-amber-400 text-amber-400" : half ? "fill-amber-200 text-amber-400" : "fill-gray-200 text-gray-300"
              }`}
          />
        );
      })}
      <span className="ml-1 text-xs text-muted-foreground font-medium">{rating}</span>
    </div>
  );
}

function Landing() {
  const { s } = useStore();
  const [slide, setSlide] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  useReveal();

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);


  return (
    <div id="home" className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Hero carousel ── */}
      <section className="relative h-[32rem] overflow-hidden md:h-[38rem]">
        {SLIDES.map((sl, i) => (
          <div
            key={sl.title}
            className={`absolute inset-0 transition-opacity duration-700 ${i === slide ? "opacity-100" : "opacity-0"}`}
          >
            <img src={sl.img} alt={sl.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-charcoal/70" />
            <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-6">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="PakDropship" className="h-10 w-10 object-contain brightness-0 invert" />
                <span className="text-white/90 text-sm font-bold uppercase tracking-widest">PakDropship</span>
              </div>
              <span
                className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground"
                style={{
                  opacity: i === slide ? 1 : 0,
                  transform: i === slide ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 0.5s 0.2s, transform 0.5s 0.2s",
                }}
              >
                {sl.kicker}
              </span>
              <h1
                className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl"
                style={{
                  opacity: i === slide ? 1 : 0,
                  transform: i === slide ? "translateY(0)" : "translateY(24px)",
                  transition: "opacity 0.55s 0.35s, transform 0.55s 0.35s",
                }}
              >
                {sl.title}
              </h1>
              <p
                className="mt-4 max-w-xl text-base text-white/80 md:text-lg"
                style={{
                  opacity: i === slide ? 1 : 0,
                  transform: i === slide ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.5s 0.48s, transform 0.5s 0.48s",
                }}
              >
                {sl.sub}
              </p>
              <div
                className="mt-8 flex flex-wrap gap-3"
                style={{
                  opacity: i === slide ? 1 : 0,
                  transform: i === slide ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 0.5s 0.6s, transform 0.5s 0.6s",
                }}
              >
                <Button size="lg" className="gap-2 rounded-none pulse-glow" asChild>
                  <Link href="/register">
                    Start Selling <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 rounded-none" asChild>
                  <Link href="/registerv">Become a Vendor</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all ${i === slide ? "w-8 bg-primary" : "w-2 bg-white/60"}`}
            />
          ))}
        </div>
      </section>

      {/* ── Business Model Banner ── */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-surface md:grid-cols-2">
          <div className="reveal-left overflow-hidden">
            <img
              src={IMG("photo-1601924994987-69e26d50dc26", 1200)}
              alt="Vendor fulfillment network"
              className="h-72 w-full object-cover md:h-full transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="p-8 md:p-12 reveal-right">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Vendor-Based Fulfillment</span>
            <h2 className="mt-3 text-3xl font-black text-charcoal md:text-4xl">
              Connect with Suppliers Across Pakistan
            </h2>
            <p className="mt-4 text-muted-foreground">
              Vendors upload products → Resellers sell → Vendors ship from their location →
              PakDropship manages the courier network and process. No warehouse, no dead stock.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[["Multi-Vendor", "Suppliers nationwide"], ["COD", "Cash on delivery"], ["1–4 days", "Fast delivery"], ["Multiple Couriers", "Compare rates"]].map(
                ([a, b], i) => (
                  <div key={b} className={`reveal stagger-${i + 1} rounded-xl bg-background p-4 card-shadow transition-transform duration-300 hover:-translate-y-1`}>
                    <p className="text-2xl font-black text-primary">{a}</p>
                    <p className="text-xs text-muted-foreground">{b}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="bg-charcoal py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="reveal text-center text-3xl font-black text-white md:text-4xl">How PakDropship Works</h2>
          <p className="reveal stagger-1 mx-auto mt-3 max-w-xl text-center text-white/60">
            Four steps between you and your first COD profit.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((st, i) => (
              <div
                key={st.t}
                className={`reveal stagger-${i + 1} rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-primary hover:-translate-y-2 hover:bg-white/10`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 hover:scale-110">
                  <st.icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-xs font-bold text-primary">STEP {i + 1}</p>
                <h3 className="mt-1 text-lg font-bold text-white">{st.t}</h3>
                <p className="mt-2 text-sm text-white/60">{st.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reseller Benefits ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="reveal text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">For Resellers</span>
          <h2 className="mt-2 text-3xl font-black text-charcoal md:text-4xl">
            Everything You Need to <span className="text-primary">Sell Online</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Start selling products across Pakistan with zero inventory. Set your own price and keep the profit.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {RESELLER_BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={`reveal stagger-${(i % 4) + 1} group rounded-2xl border border-border bg-background p-6 card-shadow transition-all duration-300 hover:-translate-y-2 hover:border-primary/40`}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-charcoal">{b.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="reveal mt-10 text-center">
          <Button size="lg" className="gap-2 rounded-full px-8 pulse-glow" asChild>
            <Link href="/register">
              Start Selling Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Vendor Benefits ── */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">For Vendors</span>
            <h2 className="mt-2 text-3xl font-black text-charcoal md:text-4xl">
              Reach More Customers Through <span className="text-primary">Resellers</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Upload your products once, let resellers sell them nationwide. Ship from your own location.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VENDOR_BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className={`reveal stagger-${(i % 3) + 1} group rounded-2xl border border-border bg-background p-6 card-shadow transition-all duration-300 hover:-translate-y-2 hover:border-primary/40`}
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-charcoal">{b.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="reveal mt-10 text-center">
            <Button size="lg" variant="outline" className="gap-2 rounded-full px-8" asChild>
              <Link href="/registerv">
                Become a Vendor <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Category grid ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="reveal grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h2 className="text-3xl font-black text-charcoal md:text-4xl">Shop-Ready Categories</h2>
            <p className="mt-2 text-muted-foreground">Managed by our vendor network.</p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            {s.categories.length} categories
          </span>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {s.categories.map((c, i) => (
            <div key={c.id} className={`reveal stagger-${(i % 4) + 1} group relative h-56 overflow-hidden rounded-2xl card-shadow`}>
              <img
                src={c.image}
                alt={c.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent" />
              <div className="absolute bottom-0 w-full p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-lg font-bold text-white">{c.title}</h3>
                <p className="text-xs text-primary">Login to view wholesale rates →</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Flip cards ── */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="reveal text-center text-3xl font-black text-charcoal md:text-4xl">Winning Product Playbooks</h2>
          <p className="reveal stagger-1 mt-3 text-center text-muted-foreground">Hover a card to reveal the ad hook.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FLIP.map((f, i) => (
              <div key={f.t} className={`reveal-scale stagger-${i + 1} flip-card h-72`}>
                <div className="flip-inner">
                  <div className="flip-face rounded-2xl card-shadow">
                    <img src={f.img} alt={f.t} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-charcoal/80 p-4">
                      <h3 className="font-bold text-white">{f.t}</h3>
                    </div>
                  </div>
                  <div className="flip-face flip-back grid place-items-center rounded-2xl bg-charcoal p-6 text-center">
                    <div>
                      <h3 className="text-lg font-bold text-primary">{f.t}</h3>
                      <p className="mt-3 text-sm text-white/80">{f.b}</p>
                      <span className="mt-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                        High demand product
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LET'S GROW TOGETHER — Marquee Gallery ── */}
      <section className="py-20 overflow-hidden bg-background">
        <div className="reveal text-center mb-10 px-6">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Community</span>
          <h2 className="mt-2 text-3xl font-black text-charcoal md:text-4xl">
            LET'S <span className="shimmer-text">GROW TOGETHER</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Join Pakistani sellers and vendors already earning through PakDropship's nationwide network.
          </p>
        </div>

        {/* Row 1 — scrolls left */}
        <div className="overflow-hidden mb-4">
          <div className="marquee-track">
            {[...GALLERY_ROW1, ...GALLERY_ROW1].map((src, i) => (
              <div
                key={i}
                className="shrink-0 w-56 h-36 md:w-72 md:h-44 rounded-2xl overflow-hidden card-shadow mx-2 transition-transform duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <img src={src} alt={`Event ${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="overflow-hidden">
          <div className="marquee-track-reverse">
            {[...GALLERY_ROW2, ...GALLERY_ROW2].map((src, i) => (
              <div
                key={i}
                className="shrink-0 w-56 h-36 md:w-72 md:h-44 rounded-2xl overflow-hidden card-shadow mx-2 transition-transform duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <img src={src} alt={`Network ${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING PRODUCTS ── */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="reveal text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Hot Right Now</span>
            <h2 className="mt-2 text-4xl font-black text-charcoal md:text-5xl">Trending Products</h2>
            <p className="mt-3 text-muted-foreground">Best-sellers from our vendor network this week.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRENDING.map((p, i) => (
              <div
                key={p.title}
                className={`reveal stagger-${(i % 3) + 1} group bg-background rounded-2xl overflow-hidden card-shadow transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0">
                    Trending 🔥
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-charcoal group-hover:text-primary transition-colors duration-200">{p.title}</h3>
                  <StarRating rating={p.rating} />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-black text-primary">{p.price}</span>
                    <Button size="sm" variant="outline" className="text-xs gap-1 rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200" asChild>
                      <Link href="/login">
                        Sell This <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="reveal mt-10 text-center">
            <Button size="lg" className="gap-2 rounded-full px-8 pulse-glow" asChild>
              <Link href="/login">
                Browse All Products <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── GET SUPPORT FOR YOUR ONLINE BUSINESS ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="reveal relative overflow-hidden rounded-3xl bg-charcoal px-8 pt-12 pb-10 md:px-14">
          {/* Decorative background blobs */}
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

          {/* Floating image */}
          <div className="absolute right-6 top-0 hidden md:flex items-start pt-6">
            <div className="float-anim">
              <img
                src={IMG("photo-1573496359142-b8d87734a5a2", 300)}
                alt="Business support"
                className="w-44 h-44 object-cover object-top rounded-full border-4 border-primary/30 shadow-2xl"
              />
            </div>
          </div>

          <div className="relative z-10 max-w-lg">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Resources</span>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl leading-tight">
              Get the Support for Your Online Business 🤝
            </h2>
            <p className="mt-3 text-white/70 text-sm">
              Everything you need to grow — from official guidelines to community and learning resources.
            </p>
          </div>

          {/* Three support cards */}
          <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-3">
            {SUPPORT_CARDS.map((card, i) => (
              <div
                key={card.title}
                className={`reveal stagger-${i + 1} group bg-background rounded-2xl p-6 card-shadow transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer`}
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary transition-transform duration-300 group-hover:scale-110">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-charcoal">{card.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                <button className="mt-4 flex items-center gap-1 text-xs font-bold text-primary transition-all duration-200 group-hover:gap-2">
                  {card.cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vision & mission ── */}
      <section id="vision" className="bg-charcoal py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2">
          <div className="reveal-left">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Our Vision &amp; Mission</span>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
              Empowering Pakistani Sellers &amp; Vendors
            </h2>
            <p className="mt-4 text-white/70">
              PakDropship connects verified vendors with resellers across Pakistan. Our vendor-based fulfillment
              model means vendors ship directly from their locations — no central warehouse needed.
              Our mission: remove capital, storage and logistics barriers so anyone can build a nationwide brand.
            </p>
            <div className="mt-8 space-y-3">
              {[
                [Package, "Vendor-based fulfillment — products ship from vendor locations"],
                [ShieldCheck, "Transparent wallet — every rupee traceable"],
                [Headphones, "Direct chat support within the platform"],
              ].map(([Icon, txt]) => {
                const I = Icon as typeof Package;
                return (
                  <div key={String(txt)} className="reveal flex items-center gap-3 text-white/85">
                    <I className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{txt as string}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div id="team" className="grid grid-cols-2 gap-4 reveal-right">
            <img src={IMG("photo-1586528116311-ad8dd3c8310d")} alt="Product sourcing" className="h-48 w-full rounded-2xl object-cover transition-transform duration-500 hover:scale-105" />
            <img src={IMG("photo-1578575437130-527eed3abbec")} alt="Vendor network" className="mt-8 h-48 w-full rounded-2xl object-cover transition-transform duration-500 hover:scale-105" />
            <img src={IMG("photo-1521737604893-d14cc237f11d")} alt="PakDropship team" className="h-48 w-full rounded-2xl object-cover transition-transform duration-500 hover:scale-105" />
            <img src={IMG("photo-1494412574643-ff11b0a5c1c3")} alt="Sellers at work" className="mt-8 h-48 w-full rounded-2xl object-cover transition-transform duration-500 hover:scale-105" />
          </div>
        </div>
      </section>

      {/* ── Sticky FAQ ── */}
      <section id="faq" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[22rem_minmax(0,1fr)] items-start">
          <div className="lg:sticky lg:top-40 reveal-left">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Support Center</span>
            <h2 className="mt-3 text-3xl font-black text-charcoal md:text-4xl">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Have questions about PakDropship? Find answers about how the platform works for resellers and vendors.
            </p>
            <div className="mt-6">
              <Button className="font-bold shadow-lg pulse-glow">Talk to Support</Button>
            </div>
          </div>

          <div className="relative flex flex-col gap-4">
            {FAQS.map(([q, a], idx) => {
              const offset = idx - activeIdx;
              const isOpen = offset === 0;

              return (
                <div
                  key={q}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    zIndex: FAQS.length - Math.abs(offset),
                    transform: offset > 0
                      ? `translateY(${offset * 12}px) scale(${1 - offset * 0.02})`
                      : offset < 0
                        ? `translateY(${offset * 12}px) scale(${1 + offset * 0.02})`
                        : "translateY(0px) scale(1)",
                    opacity: Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.15,
                    pointerEvents: Math.abs(offset) > 3 ? "none" : "auto",
                    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  className={`relative group cursor-pointer rounded-3xl border bg-background p-6 md:p-8 card-shadow overflow-hidden ${isOpen
                    ? "border-primary bg-background shadow-2xl ring-2 ring-primary/20"
                    : "border-border/60 bg-surface/90 hover:bg-surface"
                    }`}
                >
                  <div className="absolute right-6 top-6 select-none pointer-events-none text-5xl md:text-6xl font-black text-primary/[0.07] tracking-tighter">
                    0{idx + 1}
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-primary">0{idx + 1}.</span>
                      <h3 className="text-base md:text-lg font-bold text-charcoal">{q}</h3>
                    </div>
                    <span className={`transition-transform duration-300 text-primary font-bold text-lg ${isOpen ? "rotate-180" : ""}`}>
                      ⌄
                    </span>
                  </div>
                  <div
                    className={`relative z-10 grid transition-all duration-400 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-border/60" : "grid-rows-[0fr] opacity-0"
                      }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm md:text-base leading-relaxed text-muted-foreground">{a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="bg-charcoal py-14 text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4">
          <div className="reveal-left">
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo.png" alt="PakDropship" className="h-10 w-10 object-contain brightness-0 invert" />
              <p className="text-xl font-black text-white">Pak<span className="text-primary">Dropship</span></p>
            </div>
            <p className="mt-3 text-sm">
              Pakistan's vendor-based dropshipping platform. Zero inventory, nationwide COD, multiple couriers, transparent payouts.
            </p>
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, Youtube].map((I, i) => (
                <span key={i} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-all duration-200 hover:bg-primary hover:scale-110 cursor-pointer">
                  <I className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
          <div className="reveal stagger-1">
            <p className="font-bold text-white">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                ["Home", "#home"],
                ["How It Works", "#how"],
                ["About Us", "#vision"],
                ["FAQ", "#faq"],
              ].map(([l, href]) => (
                <li key={l}><a href={href} className="hover:text-primary transition-colors duration-150">{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="reveal stagger-2">
            <p className="font-bold text-white">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                ["Terms & Conditions", "/terms"],
                ["Privacy Policy", "/privacy-policy"],
                ["Refund Policy", "/refund-policy"],
                ["RTO Policy", "/rto-policy"],
                ["Shipping Policy", "/shipping-policy"],
                ["Vendor Agreement", "/vendor-agreement"],
              ].map(([l, href]) => (
                <li key={l}><Link href={href} className="hover:text-primary transition-colors duration-150">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="reveal stagger-3">
            <p className="font-bold text-white">Contact</p>
            <p className="mt-3 flex gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              Pakistan
            </p>
            <p className="mt-3 text-sm">support@pakdropship.site</p>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-6 pt-6 text-xs">
          © {new Date().getFullYear()} PakDropship. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
