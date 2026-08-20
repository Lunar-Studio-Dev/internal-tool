import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Logo className="size-5" />
        Lunar Studio
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
