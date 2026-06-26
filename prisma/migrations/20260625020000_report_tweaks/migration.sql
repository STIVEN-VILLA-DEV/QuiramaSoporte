-- AlterTable
ALTER TABLE "support_tickets" ALTER COLUMN "employee_email" DROP NOT NULL;
ALTER TABLE "support_tickets" ADD COLUMN "is_blocking" BOOLEAN NOT NULL DEFAULT false;
