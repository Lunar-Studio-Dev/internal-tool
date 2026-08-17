import { LockIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutAction } from "@/features/auth/actions";

/** Shown when an authenticated user is not an ACTIVE, linked team member. */
export function NoAccessScreen({ email, message }: { email: string; message: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <SparklesIcon className="size-5" />
        Lunar Studio
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="items-start gap-2">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LockIcon className="size-5" />
          </span>
          <CardTitle>No access</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {email ? (
            <p className="text-sm text-muted-foreground">Signed in as {email}</p>
          ) : null}
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
