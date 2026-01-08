import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

interface UserProfile {
  id: string;
  userId: string;
  fullName: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/me"],
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

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

  const isProfileComplete = Boolean(
    user?.profile?.fullName &&
    user?.profile?.phone &&
    user?.profile?.addressLine1 &&
    user?.profile?.city &&
    user?.profile?.state &&
    user?.profile?.zip &&
    user?.profile?.country
  );

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
