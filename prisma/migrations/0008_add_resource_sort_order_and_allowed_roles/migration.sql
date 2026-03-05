-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "allowedRoles" "Role"[] DEFAULT ARRAY['EMPLOYEE', 'MANAGER', 'AREA_LEAD', 'LEADERSHIP', 'ADMIN']::"Role"[];
