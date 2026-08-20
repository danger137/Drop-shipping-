import { getRoleCookie } from "@/lib/role-cookie";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const role = getRoleCookie();
    // Temporary testing mode: allow admin route access without strict auth redirect.
    // if (role !== "admin") {
    //     redirect("/login");
    // }
    return <>{children}</>;
}
