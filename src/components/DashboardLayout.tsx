'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, Bell, Eye, LogOut, ChevronRight, User } from "lucide-react";
import { useStore, PKR, type Notification } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DevSwitcher } from "./SiteHeader";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DashboardLayoutProps {
  title: string;
  role: "admin" | "reseller" | "vendor";
  items: SidebarItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
  children: React.ReactNode;
}

export function DashboardLayout({
  title,
  role,
  items,
  activeItem,
  onItemChange,
  children,
}: DashboardLayoutProps) {
  const { s, me, meVendor, markNotificationsRead, markSingleNotificationRead } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Filter notifications for this user/role
  const myNotifs = s.notifications.filter((n) => {
    if (role === "admin") return n.target === "admin";
    if (role === "vendor") return n.target === meVendor.id;
    return n.target === me.id;
  });

  const unreadCount = myNotifs.filter((n) => !n.read).length;

  const handleMarkRead = () => {
    const target = role === "admin" ? "admin" : (role === "vendor" ? meVendor.id : me.id);
    markNotificationsRead(target);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F9F9FC] overflow-hidden">


      <div className="flex-1 flex flex-row relative overflow-hidden">
        {/* Backdrop for mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#EBEAED] flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-full shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {/* Sidebar Top: Logo & Title */}
          <div>
            <div className="h-16 px-6 border-b border-[#F4F3F6] flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="PakDropship" className="h-8 w-8 object-contain" />
                <span className="text-lg font-black tracking-tight text-charcoal">
                  Pak<span className="text-primary">Dropship</span>
                </span>
              </Link>
              <button
                className="lg:hidden text-muted-foreground p-1 hover:bg-[#F5F5F7] rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar Branding Header */}
            <div className="px-6 py-4 flex items-center gap-3">
              {role === "reseller" ? (
                <>
                  {me.brandLogo ? (
                    <img
                      src={me.brandLogo}
                      alt={me.brandName}
                      className="h-10 w-10 rounded-xl object-cover border border-[#EBEAED]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl border border-[#EBEAED] bg-gray-50 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reseller</p>
                    <h3 className="text-sm font-bold text-charcoal truncate">{me.brandName}</h3>
                  </div>
                </>
              ) : role === "vendor" ? (
                <>
                  {meVendor.brandLogo ? (
                    <img
                      src={meVendor.brandLogo}
                      alt={meVendor.brandName}
                      className="h-10 w-10 rounded-xl object-cover border border-[#EBEAED]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl border border-[#EBEAED] bg-gray-50 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendor</p>
                    <h3 className="text-sm font-bold text-charcoal truncate">{meVendor.brandName}</h3>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="PakDropship" className="h-9 w-9 object-contain rounded-xl" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Control Panel</p>
                    <h3 className="text-sm font-bold text-charcoal">Main Owner Admin</h3>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Navigation links - scrollable */}
          <nav className="flex-1 overflow-y-auto scrollbar-hide px-4 py-2 space-y-1 ">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onItemChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={`group w-full flex items-center justify-between px-4 py-3   text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-charcoal hover:text-white"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-white"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      className={`text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : ""}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Bottom Profile/Quick Status */}
          <div className="p-4 border-t border-[#F4F3F6] bg-[#FAF9FC]">
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-charcoal hover:bg-[#EBEAED] transition-colors">
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Sign out
              </span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Panel */}
          <header className="h-16 bg-white border-b border-[#EBEAED] flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30 shadow-sm shadow-[#EBEAED]/20">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-charcoal p-2 hover:bg-[#F4F3F6] rounded-xl"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-lg md:text-xl font-extrabold text-charcoal tracking-tight">
                {items.find((item) => item.id === activeItem)?.label || title}
              </h2>
            </div>

            {/* Notification Bell & Profile Controls */}
            <div className="flex items-center gap-4 relative">
              {/* Notification Popover Button */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-[#EBEAED] hover:bg-[#FAF9FC] relative"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell className="h-5 w-5 text-charcoal" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown Panel */}
                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#EBEAED] rounded-3xl shadow-xl z-50 py-3 flex flex-col card-shadow max-h-[480px]">
                      <div className="px-5 pb-3 border-b border-[#F4F3F6] flex items-center justify-between">
                        <span className="font-extrabold text-sm text-charcoal">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkRead}
                            className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto divide-y divide-[#F4F3F6] flex-1 max-h-[350px]">
                        {myNotifs.length === 0 ? (
                          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            No notifications yet.
                          </div>
                        ) : (
                          myNotifs.map((n) => {
                            // Determine which tab to navigate to based on notification content
                            const getTargetTab = (notif: Notification): string | null => {
                              const t = (notif.title + " " + notif.message).toLowerCase();
                              if (t.includes("product") && (t.includes("edit") || t.includes("delete") || t.includes("submitted") || t.includes("approved") || t.includes("rejected") || t.includes("resubmit"))) return "products";
                              if (t.includes("kyc") || t.includes("registration") || t.includes("vendor") && t.includes("account")) return "kyc";
                              if (t.includes("unlock") || t.includes("top-up") || t.includes("wallet") || t.includes("credit")) return "unlocks";
                              if (t.includes("order")) return "orders";
                              if (t.includes("payout") || t.includes("withdraw")) return "wallet";
                              if (t.includes("chat") || t.includes("message") || t.includes("support")) return "chat";
                              return null;
                            };
                            const targetTab = getTargetTab(n);

                            return (
                              <div
                                key={n.id}
                                className={`p-4 transition-colors relative cursor-pointer ${!n.read ? "bg-primary/[0.03]" : "hover:bg-[#FAF9FC]"
                                  }`}
                                onClick={() => {
                                  if (!n.read) {
                                    markSingleNotificationRead(n.id);
                                  }
                                  if (targetTab) {
                                    onItemChange(targetTab);
                                  }
                                  setNotifOpen(false);
                                }}
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex items-start gap-2">
                                    {!n.read && <span className="h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                    <span className={`text-sm font-extrabold ${!n.read ? "text-primary" : "text-charcoal"}`}>
                                      {n.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap mt-1">
                                    {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className={`text-xs mt-1.5 leading-relaxed ${!n.read ? "text-charcoal/80 ml-4 font-medium" : "text-muted-foreground"}`}>
                                  {n.message}
                                </p>
                                {targetTab && (
                                  <span className="text-[10px] text-primary font-semibold mt-1.5 ml-4 block">Click to view →</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Info */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold text-charcoal">
                  {role === "reseller" ? me.name : "System Owner"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {role === "reseller" ? me.phone : "Superadmin"}
                </span>
              </div>
            </div>
          </header>

          {/* Page Contents Pane */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
