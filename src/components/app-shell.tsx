import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ScanSearch,
  History,
  BarChart3,
  User,
  Shield,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const baseItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Threat Scanner", url: "/scanner", icon: ScanSearch },
  { title: "Scan History", url: "/history", icon: History },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = isAdmin
    ? [...baseItems, { title: "Admin", url: "/admin", icon: ShieldAlert }]
    : baseItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-cyber shadow-glow">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-sm font-bold tracking-tight">PVS</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ThreatLens</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && (
          <div className="rounded-md bg-sidebar-accent/50 p-3 text-xs text-muted-foreground">
            <div className="font-mono text-primary">● ONLINE</div>
            <p className="mt-1 leading-snug">AI gateway active. All scans encrypted in transit.</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setEmail(u.user?.email ?? "");
      if (u.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.user.id);
        setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SideNav isAdmin={isAdmin} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
                THREAT MONITOR ACTIVE
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
