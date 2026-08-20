export const ROLE_COOKIE = "pakdropship-role";

export function setRoleCookie(role: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearRoleCookie() {
    if (typeof document === "undefined") return;
    document.cookie = `${ROLE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getRoleCookie() {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${ROLE_COOKIE}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
