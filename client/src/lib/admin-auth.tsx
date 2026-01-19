import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

interface AdminSession {
  authenticated: boolean;
  username?: string;
}

interface AdminAuthContextType {
  isAdmin: boolean;
  adminUsername: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetch: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data: session, isLoading, refetch } = useQuery<AdminSession>({
    queryKey: ["/api/admin/session"],
    queryFn: async () => {
      const res = await fetch("/api/admin/session", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const signOut = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
    } catch (error) {
      console.error("Admin logout error:", error);
    } finally {
      queryClient.setQueryData(["/api/admin/session"], { authenticated: false });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    }
  }, [queryClient]);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin: session?.authenticated ?? false,
        adminUsername: session?.username ?? null,
        isLoading,
        signOut,
        refetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
