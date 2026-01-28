import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, KeyRound } from "lucide-react";

export default function AdminSignInPage() {
  const [apiKey, setApiKey] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const refreshAdminSession = async () => {
    // Invalidate and wait for refetch to complete in AdminAuthProvider
    await queryClient.refetchQueries({
      queryKey: ["/api/admin/session"],
    });
  };

  const loginMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      return await apiRequest("POST", "/api/admin/login", { apiKey });
    },
    onSuccess: async () => {
      toast({
        title: "Admin access granted",
        description: "Welcome to the Admin Console.",
      });
      await refreshAdminSession();
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Authentication failed",
        description: error.message || "Invalid admin credentials.",
        variant: "destructive",
      });
      setApiKey("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      loginMutation.mutate(apiKey.trim());
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-admin-signin-title">
              Admin Console
            </CardTitle>
            <CardDescription>
              Enter your admin API key to access the control room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Admin API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter admin API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  autoFocus
                  autoComplete="off"
                  data-testid="input-admin-api-key"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending || !apiKey.trim()}
                data-testid="button-admin-login"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {loginMutation.isPending ? "Authenticating..." : "Access Admin Console"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Admin access requires a valid API key. Contact your system administrator if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
