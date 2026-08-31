import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Plus, User, Shield, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMe } from "@/hooks/use-me";
import { useConstructionMode } from "@/hooks/use-construction-mode";

const baseNavItems = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/create", label: "Create", icon: Plus },
  { to: "/profile", label: "Profile", icon: User },
];

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/login",
  "/register",
  "/join",
  "/guest",
  "/demo-report",
  "/consent-safety",
  "/support",
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { me } = useMe();
  const construction = useConstructionMode();
  const userNavItems = construction.enabled && !me?.isAdmin
    ? baseNavItems.filter((item) => item.to !== "/create")
    : baseNavItems;
  const navItems = me?.isAdmin
    ? [...userNavItems, { to: "/admin", label: "Admin", icon: Shield }]
    : userNavItems;
  const hideNav =
    pathname === "/admin" ||
    PUBLIC_PATHS.includes(pathname) ||
    /^\/journey\/[^/]+/.test(pathname) ||
    pathname.startsWith("/assessment/") ||
    pathname.startsWith("/guest/");
  const hideHeader = pathname === "/guest" || pathname.startsWith("/guest/");
  const showPublicSignIn = hideNav && pathname !== "/admin" && !construction.enabled;
  const adminWorkspace = pathname === "/admin";

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && (
        <header className="sticky top-0 z-40 bg-background border-b border-white/5">
          <div
            className={`px-4 py-3 flex items-center justify-between mx-auto ${adminWorkspace ? "max-w-7xl" : "max-w-3xl"}`}
          >
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="RedFlagDaddy"
                width={1200}
                height={400}
                loading="eager"
                className="h-auto w-[180px] sm:w-[240px]"
              />
            </Link>
            {showPublicSignIn && (
              <Link
                to="/login"
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm hover:bg-white/5 transition"
              >
                <LogIn className="w-4 h-4" /> Sign in
              </Link>
            )}
          </div>
        </header>
      )}

      <main
        className={`flex-1 px-4 pt-6 mx-auto w-full ${adminWorkspace ? "max-w-7xl pb-10" : "max-w-3xl pb-28"}`}
      >
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {PUBLIC_PATHS.includes(pathname) && (
        <footer className="px-4 pb-8 text-center text-xs text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <span aria-hidden="true" className="px-2">·</span>
          <Link to="/consent-safety" className="hover:text-foreground">Consent, safety &amp; analytics</Link>
          <span aria-hidden="true" className="px-2">·</span>
          <Link to="/support" className="hover:text-foreground">Support</Link>
        </footer>
      )}

      {!hideNav && (
        <nav className="fixed bottom-4 left-4 right-4 z-40 max-w-3xl mx-auto">
          <div className="glass-strong rounded-2xl px-2 py-2 flex justify-around">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs"
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-gradient-to-br from-aurora-1/30 to-aurora-2/30 rounded-xl border border-white/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`relative ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
