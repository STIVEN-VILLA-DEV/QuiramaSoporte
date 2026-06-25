import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ============================================================
// AUDIT LOG HELPER
// ============================================================

export async function logAudit(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        entity_type: entityType ?? null,
        entity_id: entityId ?? null,
        details: (details ?? {}) as unknown as Prisma.InputJsonValue,

        ip_address: ipAddress ?? null,
      },
    });
  } catch {
    // Non-critical — don't fail main operation
    if (process.env.NODE_ENV === "development") {
      console.error("Audit log failed — non-critical, continuing");
    }
  }
}
