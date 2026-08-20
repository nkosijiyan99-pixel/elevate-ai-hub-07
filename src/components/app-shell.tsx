import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  Calendar,
  Grid2x2Check,
  LayoutDashboard,
  Library,
  Mail,
  Menu,
  MessagesSquare,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  Telescope,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AI_DISCLAIMER, notifications } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Smart Email Generator", icon: Mail },
  { to: "/meetings", label: "Meeting Notes Summarizer", icon: NotebookPen },
  { to: "/planner", label: "AI Task Planner", icon: Calendar },
  { to: "/research", label: "AI Research Assistant", icon: Telescope },
  { to: "/chat", label: "Workplace AI Chat", icon: MessagesSquare },
  { to: "/insights", label: "Productivity Insights", icon: TrendingUp },
  { to: "/history", label: "Saved History", icon: Bookmark },
  { to: "/prompts", label: "Prompt Library", icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("workflow-ai:theme");
    const isDark = stored ? stored === "dark" : false;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("workflow-ai:theme", next ? "dark" : "light");
      return next;
    });
  };

  return { dark, toggle };
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="WorkFlow AI home">
      <span className="brand-gradient-bg flex size-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm">
        <Grid2x2Check className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight">WorkFlow AI</span>
          <span className="text-[11px] text-muted-foreground">Workplace intelligence</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className={cn("size-4.5 shrink-0", active && "text-sidebar-primary")} aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return NAV_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search workspace, tools and history..."
        aria-label="Global search"
        className="bg-muted/60 pl-9"
      />
      {results.length > 0 && (
        <ul className="glass-card absolute top-full z-50 mt-2 w-full overflow-hidden p-1">
          {results.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={() => setQuery("")}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent/15"
              >
                <Icon className="size-4 text-primary" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { dark, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-[272px]",
        )}
      >
        <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-2")}>
          <Logo compact={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks collapsed={collapsed} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2 text-muted-foreground"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center px-4">
                <Logo />
              </div>
              <div className="overflow-y-auto pb-6">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Logo compact />
          </div>

          <div className="hidden flex-1 md:flex">
            <GlobalSearch />
          </div>
          <div className="flex-1 md:hidden" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-2">
              <p className="px-2 py-1.5 text-sm font-semibold">Notifications</p>
              {notifications.map((n) => (
                <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-muted">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-1.5 sm:px-2" aria-label="User profile">
                <Avatar className="size-8">
                  <AvatarFallback className="brand-gradient-bg text-xs font-semibold text-primary-foreground">
                    NJ
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">Nkosingiphile</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>Nkosingiphile Jiyane</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Operations Lead · Pro plan
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/history">Saved history</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-border/70 px-4 py-4 md:px-6 lg:px-8">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
            <p>{AI_DISCLAIMER}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {eyebrow && (
          <Badge variant="secondary" className="gap-1 text-[11px] font-medium">
            <Sparkles className="size-3 text-accent" aria-hidden />
            {eyebrow}
          </Badge>
        )}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}