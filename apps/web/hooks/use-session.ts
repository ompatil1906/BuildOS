"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, login } from "@/lib/api";

export function useSession() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const demoLogin = useMutation({
    mutationFn: () => login(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] })
  });

  return {
    user: me.data,
    isLoading: me.isLoading || demoLogin.isPending,
    error: me.error,
    demoLogin: demoLogin.mutate,
    isAuthenticated: Boolean(me.data)
  };
}

