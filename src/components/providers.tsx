"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/lib/query/provider";
import { Toaster } from "./ui/sonner";
import { TooltipProvider } from "./ui/tooltip";

/**
 * App-wide client providers.
 *
 * Order (outer -> inner): Theme -> Query -> children + Toaster.
 * PHASE_2 wraps this with the Neon Auth <StackProvider/>.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
    >
      <QueryProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </ThemeProvider>
  );
}
