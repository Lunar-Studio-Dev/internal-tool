"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="text-destructive">*</span>
      ) : (
        <span className="font-normal text-muted-foreground">(optional)</span>
      )}
    </Label>
  );
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-destructive">{error}</p>;
}
