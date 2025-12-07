import { useQuery, useMutation } from "@tanstack/react-query";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: any) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Signup failed");
      return res.json();
    },
  });
};
