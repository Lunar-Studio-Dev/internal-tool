import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/** Lunar Studio mark. Uses `currentColor` so it follows light/dark foreground. */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
      {...props}
    >
      <path d="M4.41 3.25L4.61 3.02L5.92 2.21L8.17 1.32L10.03.97H12.27L14.67 1.47L16.76 2.4L18.7 3.79L20.01 5.19L21.1 6.81L21.99 8.9L22.41 10.84V13.47L21.95 15.87L20.9 18.19L19.66 19.9L18.15 21.33L17.23 21.99L15.99 22.65L15.68 22.61L15.48 22.37V21.99L16.65 19.97L17.19 18.5L17.61 16.34V14.71L17.38 12.7L16.88 11.07L16.18 9.6L15.14 8.05L13.97 6.81L13.2 6.15L12.19 5.46L10.88 4.76L9.25 4.18L7.94 3.91L6.7 3.79L4.76 3.87L4.53 3.72L4.41 3.33Z" />
      <path d="M1.47 8.4L1.97 7.97L2.9 7.51L4.3 7.05L5.54 6.85H6.93L7.78 6.97L9.1 7.32L10.65 8.05L12.12 9.17L13.35 10.65L14.17 12.19L14.63 13.74L14.79 14.9V15.99L14.63 17.15L14.17 18.7L13.35 20.25L12.5 21.33L11.11 22.53L10.26 23.03L9.87 22.92L9.72 22.53L10.45 21.06L10.88 19.82L11.11 18.5V17.26L11.03 16.18L10.65 14.71L9.6 12.7L8.4 11.3L6.77 10.1L5.54 9.52L4.53 9.21L3.29 9.02H1.9L1.59 8.83L1.47 8.44Z" />
    </svg>
  );
}
