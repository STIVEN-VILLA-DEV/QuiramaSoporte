"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma, serialize } from "@/lib/prisma";
import { logAudit } from "@/lib/db";
import { getSession, canWrite } from "@/lib/auth";
import { maintenanceSchema, getFirstError } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ApiResponse, MaintenanceRecord, PaginatedResponse, MaintenanceFilters, MaintenanceType, MaintenanceStatus, Priority } from "@/types";
import type { Prisma } from "@prisma/client";

type MaintenanceWithJoins = MaintenanceRecord & {
  device_name?: string;
  technician_name?: string;
};

// ============================================================
// HELPERS
// ============================================================

async function getMaintenanceWithJoins(
  where: Prisma.MaintenanceRecordWhereInput,
  skip: number,
  per_page: number
) {
  const rows = await prisma.maintenanceRecord.findMany({
    where,
    orderBy: { created_at: "desc" },
    skip,
    take: per_page,
    include: {
      device: { select: { name: true } },
      technician: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    ...r,
    device_name: r.device?.name,
    technician_name: r.technician?.name,
  })) as unknown as MaintenanceWithJoins[];
}

// ============================================================
// GET MAINTENANCE RECORDS
// ============================================================

export async function getMaintenanceAction(
  filters: MaintenanceFilters = {}
): Promise<PaginatedResponse<MaintenanceRecord>> {
  const session = await getSession();
  if (!session) redirect("/login");

  const { device_id, status, type, priority, page = 1, per_page = 20 } = filters;
  const skip = (page - 1) * per_page;

  const where: Prisma.MaintenanceRecordWhereInput = {};

  if (device_id) where.device_id = device_id;
  if (status) where.status = status as Prisma.EnumMaintenanceStatusFilter["equals"];
  if (type) where.type = type as Prisma.EnumMaintenanceTypeFilter["equals"];
  if (priority) where.priority = priority as Prisma.EnumPriorityFilter["equals"];

  const [rows, total] = await Promise.all([
    getMaintenanceWithJoins(where, skip, per_page),
    prisma.maintenanceRecord.count({ where }),
  ]);

  return serialize({
    data: rows as unknown as MaintenanceRecord[],
    total,
    page,
    per_page,
    total_pages: Math.ceil(total / per_page),
  });
}

// ============================================================
// CREATE MAINTENANCE RECORD
// ============================================================

export async function createMaintenanceAction(
  _prev: ApiResponse,
  formData: FormData
): Promise<ApiResponse<MaintenanceRecord>> {
  const session = await getSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!canWrite(session.role)) return { success: false, error: "Sin permisos" };

  const headersList = await headers();
  const ip = getClientIp(headersList);

  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return { success: false, error: limit.message ?? "Demasiadas solicitudes" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const m = parsed.data;

  try {
    const record = await prisma.maintenanceRecord.create({
      data: {
        device_id: m.device_id,
        type: m.type as MaintenanceType,
        status: m.status as MaintenanceStatus,
        priority: m.priority as Priority,
        title: m.title,
        description: m.description,
        scheduled_date: m.scheduled_date ? new Date(m.scheduled_date) : null,
        technician_id: m.technician_id || null,
        cost: m.cost ?? null,
        parts_used: m.parts_used || null,
        findings: m.findings || null,
        next_maintenance: m.next_maintenance ? new Date(m.next_maintenance) : null,
        created_by: session.id,
      },
    });

    // Update device last_maintenance
    if (m.status === "completed") {
      const deviceUpdate: Prisma.DeviceUpdateInput = {
        last_maintenance: new Date(),
      };
      if (m.next_maintenance) {
        deviceUpdate.next_maintenance = new Date(m.next_maintenance);
      }
      await prisma.device.update({
        where: { id: m.device_id },
        data: deviceUpdate,
      });
    }

    await logAudit(session.id, "CREATE_MAINTENANCE", "maintenance", record.id, undefined, ip);
    revalidatePath("/dashboard/maintenance");
    return { success: true, data: serialize(record) as unknown as MaintenanceRecord };
  } catch (err) {
    console.error("Create maintenance error:", err);
    return { success: false, error: "Error al crear registro de mantenimiento" };
  }
}

// ============================================================
// UPDATE MAINTENANCE RECORD
// ============================================================

export async function updateMaintenanceAction(
  id: string,
  _prev: ApiResponse,
  formData: FormData
): Promise<ApiResponse<MaintenanceRecord>> {
  const session = await getSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (!canWrite(session.role)) return { success: false, error: "Sin permisos" };

  const headersList = await headers();
  const ip = getClientIp(headersList);

  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return { success: false, error: limit.message ?? "Demasiadas solicitudes" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = maintenanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const m = parsed.data;

  try {
    const record = await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        type: m.type as MaintenanceType,
        status: m.status as MaintenanceStatus,
        priority: m.priority as Priority,
        title: m.title,
        description: m.description,
        scheduled_date: m.scheduled_date ? new Date(m.scheduled_date) : null,
        technician_id: m.technician_id || null,
        cost: m.cost ?? null,
        parts_used: m.parts_used || null,
        findings: m.findings || null,
        next_maintenance: m.next_maintenance ? new Date(m.next_maintenance) : null,
        ...(m.status === "completed" ? { completed_date: new Date() } : {}),
      },
    });

    await logAudit(session.id, "UPDATE_MAINTENANCE", "maintenance", id, undefined, ip);
    revalidatePath("/dashboard/maintenance");
    return { success: true, data: serialize(record) as unknown as MaintenanceRecord };
  } catch (err) {
    console.error("Update maintenance error:", err);
    return { success: false, error: "Error al actualizar mantenimiento" };
  }
}

// ============================================================
// DELETE MAINTENANCE RECORD
// ============================================================

export async function deleteMaintenanceAction(id: string): Promise<ApiResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: "No autenticado" };
  if (session.role !== "admin") return { success: false, error: "Solo administradores" };

  const headersList = await headers();
  const ip = getClientIp(headersList);

  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return { success: false, error: limit.message ?? "Demasiadas solicitudes" };
  }

  try {
    await prisma.maintenanceRecord.delete({ where: { id } });
    await logAudit(session.id, "DELETE_MAINTENANCE", "maintenance", id, undefined, ip);
    revalidatePath("/dashboard/maintenance");
    return { success: true };
  } catch (err) {
    console.error("Delete maintenance error:", err);
    return { success: false, error: "Error al eliminar" };
  }
}


