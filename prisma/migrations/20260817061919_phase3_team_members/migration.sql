-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'CLIENT_MANAGER', 'BUSINESS_ANALYST', 'SALES', 'FINANCE', 'DEVELOPER', 'PROJECT_MANAGER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member_role" (
    "memberId" TEXT NOT NULL,
    "role" "RoleName" NOT NULL,

    CONSTRAINT "team_member_role_pkey" PRIMARY KEY ("memberId","role")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_member_authUserId_key" ON "team_member"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_email_key" ON "team_member"("email");

-- AddForeignKey
ALTER TABLE "team_member_role" ADD CONSTRAINT "team_member_role_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
