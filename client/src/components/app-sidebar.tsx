import { LayoutDashboard, FileText, CheckSquare, Network, Settings, LogOut, Receipt, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Create Request", url: "/create-request", icon: FileText },
    { title: "Invoice Upload", url: "/invoice-upload", icon: Receipt },
    { title: "Approvals", url: "/approvals", icon: CheckSquare },
    { title: "Org Chart", url: "/org-chart", icon: Network },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const adminItems = user?.role === "Admin" ? [
    { title: "Admin Settings", url: "/admin", icon: Settings },
  ] : [];

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U"; // Default to 'U' for User
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-lg">
              RF
            </div>
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">RapidFunds</h2>
            </div>
          </div>
        </SidebarGroup>

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} data-testid="link-admin-settings">
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? getInitials(user.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">
                  {user?.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
                  {user?.role}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logoutMutation.mutate()} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
