import { ReactNode, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { User, Package, Wallet, RefreshCcw, Shield, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/account", label: "Dashboard", icon: LayoutDashboard },
  { path: "/account/commitments", label: "Commitments", icon: Package },
  { path: "/account/profile", label: "Profile", icon: User },
  { path: "/account/escrow", label: "Payments & Escrow", icon: Wallet },
  { path: "/account/refunds", label: "Refunds", icon: RefreshCcw },
  { path: "/account/security", label: "Security", icon: Shield },
];

interface AccountLayoutProps {
  children: ReactNode;
  returnTo?: string | null;
}

export function AccountLayout({ children, returnTo }: AccountLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = returnTo ? `${location}?returnTo=${encodeURIComponent(returnTo)}` : location;
      setLocation(`/signin?next=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoading, isAuthenticated, setLocation, location, returnTo]);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/signin");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="flex gap-8">
            <Skeleton className="w-56 h-64 hidden md:block" />
            <Skeleton className="flex-1 h-96" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" data-testid="text-account-heading">Account</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <nav className="md:w-56 shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
              {navItems.map((item) => {
                // Handle /account path matching (both "/account" and "/account/" should match)
                const isActive = item.path === "/account"
                  ? (location === "/account" || location === "/account/")
                  : location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "justify-start gap-2 w-full whitespace-nowrap",
                        isActive && "bg-muted"
                      )}
                      data-testid={`nav-${item.path.split("/").pop() || "account"}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              <div className="hidden md:block border-t my-2" />
              <Button
                variant="ghost"
                className="justify-start gap-2 w-full text-muted-foreground"
                onClick={handleSignOut}
                data-testid="button-signout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </Layout>
  );
}
