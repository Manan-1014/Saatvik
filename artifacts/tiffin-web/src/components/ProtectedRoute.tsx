import { useLocation } from "wouter";
import { useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (adminOnly && !isAdmin) {
      setLocation("/");
    }
  }, [isAuthenticated, isAdmin, adminOnly, setLocation]);

  if (!isAuthenticated) return null;
  if (adminOnly && !isAdmin) return null;
  return <>{children}</>;
}
