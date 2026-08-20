import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    resellerId?: string | null;
    vendorId?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    resellerId?: string | null;
    vendorId?: string | null;
  }
}
