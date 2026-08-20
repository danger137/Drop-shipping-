"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CheckCircle2, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If the user's role somehow changes (e.g. approved), redirect them to app
    if (status === "authenticated" && session?.user?.role && session.user.role !== "pending") {
      router.push("/app");
    }
  }, [session, status, router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-background p-8 md:p-12 rounded-none border border-border shadow-xl text-center relative">
        
        <div className="absolute top-6 right-6">
          <Button variant="ghost" className="text-muted-foreground hover:text-charcoal flex items-center gap-2" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="PakDropship" className="h-14 w-14 object-contain" />
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">Pak<span className="text-primary">Dropship</span></h1>
        </div>
        
        <div className="py-12 flex flex-col items-center">
          <div className="relative">
            <CheckCircle2 className="h-24 w-24 text-emerald-500/20" />
            <Clock className="h-12 w-12 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="mt-8 text-2xl font-black text-charcoal">Waiting for Approval</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
            Hi {session?.user?.name || "there"}, we have received your application. Our admin team is currently reviewing your KYC documents and details.
          </p>
          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 w-full max-w-sm rounded-none">
            <h4 className="font-bold text-primary mb-2">What happens next?</h4>
            <p className="text-sm text-charcoal/80">
              Reviews typically take 24-48 hours. Once approved, you will get full access to your dropshipping dashboard. You can check back here anytime to see your status.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
