import { ReactNode, useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  FileStack,
  Wallet,
  RotateCcw,
  ClipboardList,
  Truck,
  Users,
  AlertTriangle,
  FileText,
  Shield,
  LogOut,
  Loader2,
  ChevronDown,
  ChevronRight,
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
    label: "Optional",
    items: [
      { path: "/admin/suppliers", label: "Suppliers", icon: Users },
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState("");

  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ authenticated: boolean; username?: string }>({
    queryKey: ["/api/admin/session"],
    retry: false,
  });

  useEffect(() => {
    if (sessionData && isAuthenticated === null) {
      setIsAuthenticated(sessionData.authenticated);
      if (sessionData.username) {
        setAdminUsername(sessionData.username);
      }
    }
  }, [sessionData, isAuthenticated]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/login", {
        apiKey: adminApiKey,
        username: adminUsername,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      setAdminApiKey("");
      setLoginError("");
      toast({ title: "Logged In", description: `Welcome, ${data.username}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
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
      setIsAuthenticated(false);
      toast({ title: "Logged Out", description: "You have been logged out." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    },
  });

  if (sessionLoading || isAuthenticated === null) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-20">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Checking authentication...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-6 py-20">
          <Card>
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <nav className="w-56 border-r bg-muted/30 p-4 hidden md:block">
          <div className="space-y-6">
            {navSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.label && (
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    {section.label}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location === item.path || location.startsWith(item.path + "/");
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2",
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
              </div>
            ))}

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => logoutMutation.mutate()}
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </Layout>
  );
}
