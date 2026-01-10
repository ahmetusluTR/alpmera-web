import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get returnTo from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get("returnTo") || "/account/commitments";

  const startAuthMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/auth/start", { email });
    },
    onSuccess: () => {
      toast({
        title: "Code sent",
        description: "Check your email for a one-time code.",
      });
      setLocation(`/auth/verify?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      startAuthMutation.mutate(email.trim());
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-signin-title">Sign In</CardTitle>
            <CardDescription>
              Enter your email to receive a one-time code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  data-testid="input-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={startAuthMutation.isPending || !email.trim()}
                data-testid="button-send-code"
              >
                <Mail className="w-4 h-4 mr-2" />
                {startAuthMutation.isPending ? "Sending..." : "Send Code"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              We use passwordless authentication. No password needed—just your email.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
