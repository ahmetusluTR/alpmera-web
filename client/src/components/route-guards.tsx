import { useEffect, type ReactNode } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface GuardProps {
  children: ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function AuthGuard({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location);
    return <Redirect to={`/auth/sign-in?returnTo=${returnTo}`} />;
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: GuardProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location);
    return <Redirect to={`/auth/sign-in?returnTo=${returnTo}`} />;
  }

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

export function PublicOnlyGuard({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect to="/account/commitments" />;
  }

  return <>{children}</>;
}
