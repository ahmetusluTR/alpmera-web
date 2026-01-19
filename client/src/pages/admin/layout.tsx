import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard,
  FileStack,
  Wallet,
  Coins,
  RotateCcw,
  ClipboardList,
  Truck,
  Users,
  AlertTriangle,
  FileText,
  Shield,
  LogOut,
  Loader2,
  Package,
  MapPin,
  ExternalLink,
} from "lucide-react";

const navSections = [
  {
    items: [
      { path: "/admin/control-room", label: "Control Room", icon: LayoutDashboard },
    ],
  },
  {
    items: [
      { path: "/admin/campaigns", label: "Campaigns", icon: FileStack },
    ],
  },
  {
    items: [
      { path: "/admin/clearing", label: "Clearing", icon: Wallet },
      { path: "/admin/credits", label: "Credits", icon: Coins },
      { path: "/admin/commitments", label: "Commitments", icon: FileText },
    ],
  },
  {
    items: [
      { path: "/admin/participants", label: "Participants", icon: Users },
    ],
  },
  {
    items: [
      { path: "/admin/refunds", label: "Refunds", icon: RotateCcw },
      { path: "/admin/refund-plans", label: "Refund Plans", icon: ClipboardList },
    ],
  },
  {
    items: [
      { path: "/admin/deliveries", label: "Deliveries", icon: Truck },
    ],
  },
  {
    label: "Operations",
    items: [
      { path: "/admin/consolidation", label: "Consolidation", icon: MapPin },
    ],
  },
  {
    label: "Inventory",
    items: [
      { path: "/admin/products", label: "Products", icon: Package },
      { path: "/admin/suppliers", label: "Suppliers", icon: Users },
    ],
  },
  {
    label: "Optional",
    items: [
      { path: "/admin/exceptions", label: "Exceptions", icon: AlertTriangle },
      { path: "/admin/audit", label: "Audit", icon: FileText },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminApiKey, setAdminApiKey] = useState("");
  const [loginError, setLoginError] = useState("");
  const refreshAdminSession = async () => {
    await queryClient.fetchQuery({
      queryKey: ["/api/admin/session"],
      queryFn: async () => {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          const text = (await res.text()) || res.statusText;
          throw new Error(`${res.status}: ${text}`);
        }
        return res.json();
      },
    });
  };

  const { isAdmin, adminUsername: adminUser, isLoading: sessionLoading } = useAdminAuth();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/login", {
        apiKey: adminApiKey,
        username: adminUsername,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      setAdminApiKey("");
      setLoginError("");
      toast({ title: "Logged In", description: `Welcome, ${data.username}` });
      await refreshAdminSession();
    },
    onError: (error: Error) => {
      setLoginError(error.message || "Invalid credentials");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout", {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Logged Out", description: "You have been logged out." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    },
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Login
            </CardTitle>
            <CardDescription>Enter your credentials to access the admin console</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                data-testid="input-login-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-api-key">Admin API Key</Label>
              <Input
                id="login-api-key"
                type="password"
                value={adminApiKey}
                onChange={(e) => setAdminApiKey(e.target.value)}
                placeholder="Enter admin API key"
                data-testid="input-login-api-key"
              />
            </div>
            {loginError && (
              <div className="text-sm text-destructive" data-testid="text-login-error">
                {loginError}
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => loginMutation.mutate()}
              disabled={loginMutation.isPending || !adminApiKey}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur-sm">
        <div className="h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-2 w-56">
            <Shield className="w-5 h-5 text-foreground" />
            <span className="font-semibold text-sm tracking-tight">Alpmera Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View Site
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex pt-14 min-h-screen">
        {/* Sidebar */}
        <nav className="w-56 border-r bg-muted/30 p-4 hidden md:block fixed top-14 bottom-0 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navSections.map((section, sectionIdx) => (
              <div key={sectionIdx} className={section.label ? "mt-4" : ""}>
                {section.label && (
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 px-2">
                    {section.label}
                  </p>
                )}
                {section.items.map((item) => {
                  const isActive = location === item.path || location.startsWith(item.path + "/");
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-2 h-9",
                          isActive && "bg-muted"
                        )}
                        data-testid={`nav-${item.path.split("/").pop()}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            ))}

            <div className="border-t mt-4 pt-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-muted-foreground"
                onClick={() => logoutMutation.mutate()}
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 md:ml-56 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
