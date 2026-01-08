import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Shield, LogOut, Mail } from "lucide-react";
import { format } from "date-fns";
import { AccountLayout } from "./layout";

export default function SecurityPage() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/signin");
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Security</CardTitle>
            </div>
            <CardDescription>
              Manage your session and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-md border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Signed in as</p>
                  <p className="text-sm text-muted-foreground font-mono" data-testid="text-session-email">
                    {user?.email}
                  </p>
                </div>
              </div>
              {user?.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Account created {format(new Date(user.createdAt), "MMMM d, yyyy")}
                </p>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-2">Session</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign out of your current session. You will need to sign in again to access your account.
              </p>
              <Button
                variant="outline"
                onClick={handleSignOut}
                data-testid="button-signout-security"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-2">Session management</h3>
              <p className="text-sm text-muted-foreground">
                Advanced session management will be available in a future update. This will include viewing active sessions and signing out from all devices.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
