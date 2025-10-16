import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, ClipboardList, Network, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Create Request", url: "/create-request", icon: FileText },
    { title: "Approvals", url: "/approvals", icon: ClipboardList },
    { title: "Org Chart", url: "/org-chart", icon: Network },
  ];

  const adminItems = user?.role === "Admin" ? [
    { title: "Admin", url: "/admin", icon: Settings },
  ] : [];

  const allItems = [...navItems, ...adminItems];

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap gap-2 justify-center">
          {allItems.map((item) => (
            <Button
              key={item.title}
              asChild
              variant={location === item.url ? "default" : "outline"}
              size="sm"
              data-testid={`bottom-nav-${item.title.toLowerCase().replace(" ", "-")}`}
            >
              <Link href={item.url} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.title}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
