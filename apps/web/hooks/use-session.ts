"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe } from "@/lib/api";

export function useSession() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });

  return {
    user: me.data,
    isLoading: me.isLoading,
    error: me.error,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
    isAuthenticated: Boolean(me.data)
  };
}
