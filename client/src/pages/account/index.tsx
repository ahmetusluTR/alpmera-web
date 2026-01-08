import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountIndex() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      const params = new URLSearchParams(searchString);
      const returnTo = params.get("returnTo");
      const nextUrl = returnTo ? `/account?returnTo=${encodeURIComponent(returnTo)}` : "/account";
      setLocation(`/signin?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    const params = new URLSearchParams(searchString);
    const returnTo = params.get("returnTo");
    
    if (returnTo) {
      setLocation(`/account/profile?returnTo=${encodeURIComponent(returnTo)}`);
    } else {
      setLocation("/account/commitments");
    }
  }, [setLocation, searchString, isAuthenticated, isLoading]);

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

  return null;
}
