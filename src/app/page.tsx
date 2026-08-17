import { redirect } from "next/navigation";

// The root path sends authenticated users into the app shell. Unauthenticated
// users are redirected to /auth/sign-in by src/proxy.ts before reaching here.
export default function RootPage() {
  redirect("/dashboard");
}
