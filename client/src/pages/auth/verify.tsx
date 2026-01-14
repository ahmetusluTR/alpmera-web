import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get email and returnTo from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email") || "";
  const returnTo = urlParams.get("returnTo") || "/account/commitments";

  const verifyMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      return await apiRequest("POST", "/api/auth/verify", { email, code });
    },
    onSuccess: () => {
      toast({
        title: "Signed in",
        description: "Welcome to Alpmera.",
      });
      // Invalidate auth state and redirect
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      window.dispatchEvent(new CustomEvent("alpmera-auth-changed"));
      setLocation(returnTo);
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && email) {
      verifyMutation.mutate({ email, code: code.trim() });
    }
  };

  if (!email) {
    return (
      <Layout>
        <div className="container max-w-md py-16">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No email provided.</p>
              <Link href="/auth/sign-in">
                <Button variant="outline" data-testid="button-back-to-signin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-verify-title">Enter Code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <span className="font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">One-time code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                  data-testid="input-code"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={verifyMutation.isPending || code.length !== 6}
                data-testid="button-verify"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                {verifyMutation.isPending ? "Verifying..." : "Verify"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>
                <Button variant="ghost" size="sm" data-testid="button-different-email">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Use different email
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
