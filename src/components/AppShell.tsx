import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Plus, User, Shield, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
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
  const [deskMode, setDeskMode] = useState(false);
  const userNavItems =
    construction.enabled && !me?.isAdmin
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
                className="h-auto w-[160px] sm:w-[220px]"
              />
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={deskMode ? "Exit desk mode" : "Open desk mode"}
                aria-pressed={deskMode}
                onClick={() => setDeskMode((open) => !open)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 py-1.5 text-lg hover:bg-white/5 transition"
              >
                <span aria-hidden="true">💼</span>
              </button>
              {showPublicSignIn && (
                <Link
                  to="/login"
                  className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm hover:bg-white/5 transition"
                >
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {deskMode && <DeskModeOverlay onClose={() => setDeskMode(false)} />}

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
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <span aria-hidden="true" className="px-2">
            ·
          </span>
          <Link to="/consent-safety" className="hover:text-foreground">
            Consent, safety &amp; analytics
          </Link>
          <span aria-hidden="true" className="px-2">
            ·
          </span>
          <Link to="/support" className="hover:text-foreground">
            Support
          </Link>
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
                  <Icon
                    className={`w-5 h-5 relative ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`relative ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  >
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

function DeskModeOverlay({ onClose }: { onClose: () => void }) {
  const columns = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const rows = [
    ["Q4 Planning", "Owner", "Status", "Priority", "Budget", "Due", "Notes", "Variance"],
    [
      "Vendor review",
      "S. Daniels",
      "In progress",
      "Medium",
      "$4,200",
      "Oct 12",
      "Awaiting reply",
      "2%",
    ],
    ["Policy refresh", "M. Khan", "Complete", "Low", "$800", "Sep 18", "Filed", "0%"],
    ["Workspace audit", "J. Miller", "In progress", "High", "$1,350", "Sep 29", "Round 2", "4%"],
    ["Quarterly deck", "A. Naidoo", "Draft", "Medium", "$650", "Oct 03", "Review copy", "1%"],
    ["Supplier terms", "N. Patel", "Blocked", "High", "$2,900", "Oct 21", "Legal input", "8%"],
    ["Ops checklist", "R. Singh", "Complete", "Low", "$300", "Sep 16", "Archived", "0%"],
    ["Training plan", "C. Meyer", "Draft", "Medium", "$1,100", "Nov 05", "Outline", "3%"],
    [
      "Forecast model",
      "L. Adams",
      "In progress",
      "High",
      "$5,600",
      "Oct 18",
      "Revise inputs",
      "6%",
    ],
    ["Access review", "D. Jacobs", "Complete", "Medium", "$400", "Sep 25", "Signed off", "0%"],
    ["Renewal tracker", "T. Botha", "Draft", "Low", "$950", "Nov 14", "Collect dates", "1%"],
    ["Invoice cleanup", "P. Williams", "In progress", "Medium", "$700", "Oct 08", "Batch 3", "2%"],
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#f6f8fb] text-slate-900">
      <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-600 text-sm font-bold text-white">
            X
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Quarterly planning workbook</p>
            <p className="mt-1 text-[11px] text-slate-500">Saved to Business Operations</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span aria-hidden="true">💼</span>
          Return
        </button>
      </div>

      <div className="flex h-[calc(100vh-3rem)] flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <span className="rounded bg-white px-2 py-1 shadow-sm">File</span>
          <span className="rounded bg-white px-2 py-1 shadow-sm">Home</span>
          <span className="rounded bg-white px-2 py-1 shadow-sm">Insert</span>
          <span className="rounded bg-white px-2 py-1 shadow-sm">Data</span>
          <span className="ml-auto hidden text-slate-400 sm:inline">100% · Editing</span>
        </div>

        <div className="flex-1 overflow-hidden p-3 sm:p-5">
          <div className="h-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <div className="grid grid-cols-[42px_repeat(8,minmax(110px,1fr))] border-b border-slate-200 bg-slate-100 text-center text-xs font-medium text-slate-500">
              <div className="border-r border-slate-200 py-2" />
              {columns.map((column) => (
                <div key={column} className="border-r border-slate-200 py-2 last:border-r-0">
                  {column}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[42px_repeat(8,minmax(110px,1fr))] text-xs">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="contents">
                  <div className="border-b border-r border-slate-200 bg-slate-50 py-3 text-center text-slate-400">
                    {rowIndex + 1}
                  </div>
                  {row.map((cell, cellIndex) => (
                    <div
                      key={`${rowIndex}-${cellIndex}`}
                      className={`truncate border-b border-r border-slate-200 px-3 py-3 last:border-r-0 ${
                        rowIndex === 0
                          ? "bg-emerald-50 font-semibold text-emerald-900"
                          : cell === "Complete"
                            ? "text-emerald-700"
                            : cell === "Blocked"
                              ? "text-amber-700"
                              : "text-slate-700"
                      }`}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
              {Array.from({ length: 14 }, (_, index) => index + rows.length + 1).map((row) => (
                <div key={row} className="contents">
                  <div className="border-b border-r border-slate-200 bg-slate-50 py-3 text-center text-slate-400">
                    {row}
                  </div>
                  {columns.map((column) => (
                    <div
                      key={`${row}-${column}`}
                      className="border-b border-r border-slate-200 px-3 py-3 last:border-r-0"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
          <span className="rounded-t-md border border-b-0 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
            Planning
          </span>
          <span className="px-3 py-1.5">Budget</span>
          <span className="px-3 py-1.5">Timeline</span>
        </div>
      </div>
    </div>
  );
}
