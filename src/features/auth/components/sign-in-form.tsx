"use client";

import { type FormEvent, useActionState, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { FieldError, FieldLabel } from "@/components/common/form-field";
import { signInAction, type AuthActionState } from "@/features/auth/actions";
import { signInSchema } from "@/features/auth/schemas/auth.schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseForm, type FieldErrors } from "@/lib/form";

const initialState: AuthActionState = {};

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = parseForm(signInSchema, {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (!parsed.ok) {
      event.preventDefault();
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Welcome back. Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <form noValidate action={formAction} onSubmit={onSubmit}>
        <CardContent className="flex flex-col gap-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="email" required>
              Email
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={200}
            />
            <FieldError error={errors.email} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="password" required>
              Password
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={200}
            />
            <FieldError error={errors.password} />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Accounts are created by an administrator. Contact your admin if you need access.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
