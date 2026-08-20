import { getRoleCookie } from "@/lib/role-cookie";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
    const role = getRoleCookie();
    // Temporary testing mode: allow vendor route access without strict auth redirect.
    // if (role !== "vendor") {
    //     redirect("/login");
    // }
    return <>{children}</>;
}
