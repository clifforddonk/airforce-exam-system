import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface User {
  _id?: string;
  fullName: string;
  email: string;
  role: "student" | "admin";
  group: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  group: number;
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          // User not authenticated or token expired/invalid
          console.log("Token invalid or expired");
        }
        return null;
      }
      const data = await res.json();
      return data.user as User;
    },
    staleTime: 10 * 60 * 1000, // ✅ User data fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // ✅ Keep in cache 30 minutes
    refetchOnMount: false, // ✅ Don't refetch on mount
    refetchOnWindowFocus: "always", // ✅ Refetch when tab focus changes
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      return data;
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async (data: SignupData) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!res.ok) {
        throw new Error(response.message || "Signup failed");
      }
      return response;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Logout failed");
      }
      return data;
    },
    onSuccess: () => {
      // Clear the currentUser cache so the app knows user is logged out
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};
