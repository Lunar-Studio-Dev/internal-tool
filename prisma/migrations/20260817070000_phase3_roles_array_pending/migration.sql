-- Add PENDING to the MemberStatus enum (not used in this migration, so safe in-tx)
ALTER TYPE "MemberStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- Roles become an enum array column on team_member
ALTER TABLE "team_member" ADD COLUMN "roles" "RoleName"[] NOT NULL DEFAULT ARRAY[]::"RoleName"[];

-- Backfill each member's roles from the join table before dropping it
UPDATE "team_member" tm
SET "roles" = sub.roles
FROM (
  SELECT "memberId", array_agg("role") AS roles
  FROM "team_member_role"
  GROUP BY "memberId"
) sub
WHERE tm."id" = sub."memberId";

-- Drop the M:N join table (roles now live in the array column)
DROP TABLE "team_member_role";
