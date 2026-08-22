"use client";

import { useCurrentMember } from "@/features/team/hooks/use-current-member";
import { ROLE_LABELS } from "@/features/team/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export function ProfileView() {
  const member = useCurrentMember();

  return (
    <Card className="max-w-lg">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="size-16 rounded-lg">
          {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
          <AvatarFallback className="rounded-lg text-lg">
            {initialsOf(member.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{member.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {member.roleNames.map((role) => (
            <Badge key={role} variant="secondary">
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {member.roleNames.length} role{member.roleNames.length === 1 ? "" : "s"} assigned
        </p>
      </CardContent>
    </Card>
  );
}
