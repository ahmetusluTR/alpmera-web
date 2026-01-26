import { Link, useLocation } from "wouter";
import { Shield, Settings, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-foreground" />
            <span className="font-semibold text-lg tracking-tight" data-testid="logo-text">Alpmera</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${location === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="link-campaigns"
            >
              Campaigns
            </Link>
            <Link
              href="/how-it-works"
              className={`text-sm font-medium transition-colors ${location === "/how-it-works" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="link-how-it-works"
            >
              How It Works
            </Link>
            {isAuthenticated && (
              <Link
                href="/account"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-account-settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {!location.startsWith("/admin") && (
              <>
                <div className="h-4 w-px bg-border" />

                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link href="/account">
                      <Button variant="ghost" size="sm" data-testid="button-account">
                        Account
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      data-testid="button-signout"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Link href="/signin">
                    <Button variant="outline" size="sm" data-testid="button-signin">
                      Sign in
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="pt-16">
        {children}
      </main>

      <footer className="border-t border-border py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Alpmera</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/status" className="hover:text-foreground transition-colors" data-testid="link-check-status">
                Check Commitment Status
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
