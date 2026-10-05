import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set([
    "/",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/pricing",
    "/acceptable-use-policy",
    "/cookie-policy",
    "/data-processing",
    "/privacy-policy",
    "/refund-policy",
    "/terms-of-service",
]);

function isPublicPath(pathname: string) {
    return publicPaths.has(pathname) || pathname.startsWith("/solutions/");
}

function isPlatformAdmin(user: { email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
    const configuredEmails = (process.env.PLATFORM_ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    const email = user.email?.toLowerCase();
    const appRole = user.app_metadata?.role;
    const userRole = user.user_metadata?.role;
    return appRole === "admin" || appRole === "platform_admin" || userRole === "platform_admin" || (!!email && configuredEmails.includes(email));
}

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookies) => {
                    cookies.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
            },
        },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !isPublicPath(request.nextUrl.pathname)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (user && (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/"))) {
        if (!isPlatformAdmin(user)) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|assets|figma).*)",
    ],
};
