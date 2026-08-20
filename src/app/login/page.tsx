"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PackageCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, s } = useStore();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) {
      toast.error("Please fill in both email and password.");
      return;
    }
    
    // Use NextAuth signIn
    const res = await signIn("credentials", {
      email,
      password: pass,
      redirect: false,
    });

    if (res?.error) {
      toast.error(res.error || "Invalid email or password.");
    } else {
      toast.success("Welcome back!");
      // Check role and redirect
      const fetchSession = async () => {
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        
        if (session?.user?.role === "pending") {
          router.push("/pending");
        } else if (email.includes("admin") || session?.user?.role === "admin") {
          router.push("/admin");
        } else if (email.includes("vendor") || session?.user?.role === "vendor") {
          router.push("/vendor");
        } else {
          router.push("/app");
        }
      };
      fetchSession();
    }
  };

  const handleDemoAdmin = () => {
    setEmail("admin@pakdropship.pk");
    setPass("admin123");
  };

  const handleDemoReseller = () => {
    setEmail("waseem@example.com");
    setPass("password");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col bg-surface border-r border-border/50 relative">
        {/* Back to Home — always visible, doesn't overlap */}
        <div className="px-8 pt-8 md:px-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-charcoal transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center p-8 md:px-24 md:pb-24">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="PakDropship" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
                <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">Pak<span className="text-primary">Dropship</span></h1>
              </div>
              <h2 className="mt-5 text-2xl sm:text-3xl font-black text-charcoal">Sign in to your account</h2>
              <p className="mt-2 text-sm text-muted-foreground">Manage your orders, view payouts, and source products at wholesale rates.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 mt-8">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 rounded-none bg-background text-base px-4"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-12 rounded-none bg-background text-base px-4"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-bold shadow-md">
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account? <Link href="/register" className="font-bold text-primary hover:underline">Apply as a Reseller</Link>
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-charcoal hidden md:flex flex-col items-center justify-center p-12 text-center text-white/80">
        <img src="/logo.png" alt="PakDropship" className="h-24 w-24 object-contain brightness-0 invert mb-6" />
        <h3 className="text-3xl font-black text-white max-w-lg leading-tight">Zero Capital. Zero Inventory. Maximum Profit.</h3>
        <p className="mt-4 max-w-md text-lg">Log in to manage your dropshipping business from anywhere.</p>
        <div className="mt-12 p-8 bg-white/5 border border-white/10 w-full max-w-sm flex flex-col gap-3">
          <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Demo Shortcuts</p>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-none" onClick={handleDemoAdmin}>Fill Admin Details</Button>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-none" onClick={handleDemoReseller}>Fill Reseller Details</Button>
        </div>
      </div>
    </div>
  );
}
