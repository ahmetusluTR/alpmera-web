import { createContext, useContext, useCallback, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

interface UserProfile {
  id: string;
  userId: string;
  fullName: string | null;
  phone: string | null;
  defaultAddressLine1: string | null;
  defaultAddressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
}

interface User {
  id: string;
  email: string;
  createdAt: string;
  profile: UserProfile | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetch: () => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const isDev = import.meta.env.MODE !== "production";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/me"],
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const handleAuthChanged = () => {
      refetch();
      // Also invalidate campaign queries since they return different data based on auth state
      // Use exact: false to match both ["/api/campaigns"] and ["/api/campaigns", id]
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"], exact: false });
    };
    window.addEventListener("alpmera-auth-changed", handleAuthChanged);
    return () => {
      window.removeEventListener("alpmera-auth-changed", handleAuthChanged);
    };
  }, [refetch, queryClient]);

  const signOut = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      queryClient.setQueryData(["/api/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    }
  }, [queryClient]);

  // Check profile completeness using correct field names from schema
  const requiredFields = [
    "fullName",
    "phone", 
    "defaultAddressLine1",
    "city",
    "state",
    "zip",
    "country"
  ] as const;

  const profile = user?.profile;
  const missingFields = profile 
    ? requiredFields.filter(field => !profile[field])
    : requiredFields;
  
  const isProfileComplete = Boolean(profile && missingFields.length === 0);

  // Dev-only logging for debugging profile completeness
  if (isDev && user && profile) {
    console.debug("[Auth] Profile completeness check:", {
      isComplete: isProfileComplete,
      missingFields: missingFields.length > 0 ? missingFields : "none",
      profile: {
        fullName: profile.fullName ? "set" : "missing",
        phone: profile.phone ? "set" : "missing",
        defaultAddressLine1: profile.defaultAddressLine1 ? "set" : "missing",
        city: profile.city ? "set" : "missing",
        state: profile.state ? "set" : "missing",
        zip: profile.zip ? "set" : "missing",
        country: profile.country ? "set" : "missing",
      }
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: Boolean(user),
        isLoading,
        signOut,
        refetch,
        isProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
