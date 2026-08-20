'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShieldCheck, Store, Eye } from "lucide-react";
import { useState } from "react";
import { useStore, type Role, PKR } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PUBLIC_LINKS = [
  { label: "Home", hash: "#home" },
  { label: "About Us", hash: "#about" },
  { label: "How It Works", hash: "#how" },
  { label: "Vision", hash: "#vision" },
  { label: "Team", hash: "#team" },
  { label: "FAQ", hash: "#faq" },
  { label: "Contact", hash: "#contact" },
];

const ROLES: { role: Role; label: string; to: string; icon: typeof Eye }[] = [
  { role: "guest", label: "View as Guest", to: "/", icon: Eye },
  { role: "reseller", label: "View as Reseller User", to: "/app", icon: Store },
  { role: "vendor", label: "View as Vendor / Supplier", to: "/vendor", icon: Store },
  { role: "admin", label: "View as MAIN OWNER ADMIN", to: "/admin", icon: ShieldCheck },
];

export function DevSwitcher() {
  const { s, setRole, me } = useStore();
  const router = useRouter();
  const path = usePathname();
  const active = ROLES.find((r) => r.role === s.role) || { role: s.role, label: "Pending", to: "/pending", icon: Eye };
  return (
    <div className="bg-charcoal text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs">
        <span className="flex items-center gap-2 font-medium opacity-80">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          DEV / DEMO MODE — switch panels instantly, no login required
        </span>
        <div className="flex items-center gap-3">
          {s.role === "reseller" && (
            <span className="hidden opacity-80 sm:inline">
              {me.brandName} · Wallet {PKR(me.balance)}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition hover:opacity-90">
                <active.icon className="h-3.5 w-3.5" />
                {active.label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Switch panel</DropdownMenuLabel>
              {ROLES.map((r) => (
                <DropdownMenuItem
                  key={r.role}
                  onClick={() => {
                    setRole(r.role);
                    router.push(r.to);
                  }}
                >
                  <r.icon className="mr-2 h-4 w-4" /> {r.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { s } = useStore();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 lg:flex lg:justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="PakDropship" className="h-9 w-9 shrink-0 object-contain" />
            <span className="truncate text-xl font-black tracking-tight text-charcoal">
              Pak<span className="text-primary">Dropship</span>
            </span>
          </Link>
          {path === "/" && (
            <nav className="hidden items-center gap-6 lg:flex">
              {PUBLIC_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.hash}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
          <div className="hidden items-center gap-2 lg:flex">
            {s.currentUser ? (
              <Button size="sm" asChild>
                <Link href={s.currentUser.role === "admin" ? "/admin" : s.currentUser.role === "vendor" ? "/vendor" : "/app"}>Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Register Free</Link>
                </Button>
              </>
            )}
          </div>
          <button
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Menu className="h-6 w-6 text-charcoal" />
          </button>
        </div>
        {open && (
          <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-3">
              {PUBLIC_LINKS.map((l) => (
                <a key={l.label} href={l.hash} onClick={() => setOpen(false)} className="text-sm font-medium">
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                {s.currentUser ? (
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={s.currentUser.role === "admin" ? "/admin" : s.currentUser.role === "vendor" ? "/vendor" : "/app"}>Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
