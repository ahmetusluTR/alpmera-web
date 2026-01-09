import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";

type Step = "email" | "code";

interface StartAuthResponse {
  success?: boolean;
  ok?: boolean;
  message?: string;
  devCode?: string;
}

export default function SignIn() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { isAuthenticated, refetch } = useAuth();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  
  const nextUrl = new URLSearchParams(search).get("next") || "/";
  const isDev = import.meta.env.MODE !== "production";
  
  useEffect(() => {
    if (isAuthenticated) {
      setLocation(nextUrl);
    }
  }, [isAuthenticated, setLocation, nextUrl]);

  const startAuthMutation = useMutation({
    mutationFn: async (emailInput: string): Promise<StartAuthResponse> => {
      const response = await apiRequest("POST", "/api/auth/start", { email: emailInput });
      const data = await response.json();
      return data;
    },
    onSuccess: (data: StartAuthResponse) => {
      if (data.devCode && isDev) {
        setDevCode(data.devCode);
      }
      setStep("code");
      toast({
        title: "Code sent",
        description: data.message || "Check your email for a 6-digit code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send code",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ email: emailInput, code: codeInput }: { email: string; code: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify", { email: emailInput, code: codeInput });
      return response.json();
    },
    onSuccess: () => {
      refetch();
      window.dispatchEvent(new Event("alpmera-auth-changed"));
      toast({
        title: "Signed in",
        description: "Welcome to Alpmera.",
      });
      setLocation(nextUrl);
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid code",
        description: error.message || "The code you entered is incorrect.",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      startAuthMutation.mutate(email.trim().toLowerCase());
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      verifyCodeMutation.mutate({ email, code: code.trim() });
    }
  };

  const handleChangeEmail = () => {
    setStep("email");
    setCode("");
    setDevCode(null);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-6 py-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in to Alpmera</CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your email to receive a sign-in code"
                : "Enter the 6-digit code sent to your email"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="email"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!email.trim() || startAuthMutation.isPending}
                  data-testid="button-send-code"
                >
                  {startAuthMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send code"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">6-digit code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="pl-10 font-mono text-lg tracking-widest"
                      required
                      autoComplete="one-time-code"
                      data-testid="input-code"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Sent to {email}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-muted-foreground"
                      onClick={handleChangeEmail}
                      data-testid="button-change-email"
                    >
                      Change email
                    </Button>
                  </div>
                  {isDev && devCode && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded" data-testid="text-dev-code">
                      Dev code: {devCode}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleChangeEmail}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={code.length !== 6 || verifyCodeMutation.isPending}
                    data-testid="button-verify"
                  >
                    {verifyCodeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
