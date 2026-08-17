import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS, ROLE_ORDER, ROLE_SUMMARIES } from "@/features/team/constants";
import { ROLE_PERMS } from "@/lib/rbac";

/** WF-47 — read-only reference of role → scope → permissions. */
export function RolesMatrix() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Role</TableHead>
            <TableHead className="w-64">Scope</TableHead>
            <TableHead>Permissions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROLE_ORDER.map((role) => (
            <TableRow key={role}>
              <TableCell className="font-medium">{ROLE_LABELS[role]}</TableCell>
              <TableCell className="text-muted-foreground">{ROLE_SUMMARIES[role]}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {ROLE_PERMS[role].map((permission) => (
                    <Badge key={permission} variant="outline" className="font-normal">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
