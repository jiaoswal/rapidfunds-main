// Browser-based authentication hook
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "../lib/database";
import { apiRequest, queryClient } from "../lib/queryClient";
import { authManager } from "../lib/browserAuth";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  verifyEmailMutation: UseMutationResult<SelectUser, Error, string>;
  requestPasswordResetMutation: UseMutationResult<void, Error, string>;
  resetPasswordMutation: UseMutationResult<void, Error, { token: string; newPassword: string }>;
  resendVerificationMutation: UseMutationResult<void, Error, void>;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
};

type LoginData = {
  email: string;
  password: string;
  orgCode?: string;
};

type RegisterData = {
  orgCode: string;
  name: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SelectUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize auth and restore session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Set up auth listener
        authManager.addAuthListener((currentUser) => {
          setUser(currentUser);
          setError(null);
        });
        
        // Get initial user state
        setUser(authManager.getCurrentUser());
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize authentication'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await authManager.login(credentials.email, credentials.password);
    },
    onSuccess: (user: SelectUser) => {
      setUser(user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", credentials);
      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      setUser(user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      authManager.logout();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error.message);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      return await authManager.verifyEmail(token);
    },
    onSuccess: (user: SelectUser) => {
      setUser(user);
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return await authManager.requestPasswordReset(email);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      return await authManager.resetPassword(token, newPassword);
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      return await authManager.resendVerificationEmail();
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        verifyEmailMutation,
        requestPasswordResetMutation,
        resetPasswordMutation,
        resendVerificationMutation,
        isAuthenticated: !!user,
        isEmailVerified: authManager.isEmailVerified(),
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
