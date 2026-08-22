"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="p-8 md:p-12">
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-charcoal flex items-center gap-2 pl-0 hover:bg-transparent" 
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full text-center space-y-10">
          
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="PakDropship" className="h-12 w-12 sm:h-14 sm:w-14 object-contain" />
            <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">Pak<span className="text-primary">Dropship</span></h1>
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-charcoal">Application Submitted</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Our team will review your application within 24 hours.
            </p>
          </div>

          <div className="py-4">
            <div className="mx-auto h-24 w-24 rounded-full border-[6px] border-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={3} />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-charcoal">Verification Pending</h3>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed text-sm">
              Thank you for applying to PakDropship. Once your KYC is verified by our admin, your account will be activated.
            </p>
          </div>

          <div className="pt-4">
            <Button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-charcoal hover:bg-charcoal/90 text-white rounded-none px-8 h-12 font-bold"
            >
              Go to Login Page
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
