'use client';
import { type ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StoreProvider>
        {children}
        <Toaster position="top-right" richColors />
      </StoreProvider>
    </SessionProvider>
  );
}
