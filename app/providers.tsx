"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ Data stays fresh for 5 minutes (no refetch during this time)
            staleTime: 1000 * 60 * 5,
            // ✅ Data stays in cache for 10 minutes even if unused
            gcTime: 1000 * 60 * 10,
            // ✅ Don't refetch when user switches back to tab
            refetchOnWindowFocus: false,
            // ✅ Don't refetch when component mounts if data exists in cache
            refetchOnMount: false,
            // ✅ Only retry failed requests once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
