"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma, serialize } from "@/lib/prisma";
import { logAudit } from "@/lib/db";
import { getSession, canWrite } from "@/lib/auth";
import { deviceSchema, getFirstError } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ApiResponse, Device, PaginatedResponse, DeviceFilters, DeviceCategory, DeviceStatus, DashboardStats } from "@/types";
import type { Prisma } from "@prisma/client";

// ============================================================
// GET ALL DEVICES (with filters + pagination)
// ============================================================

export async function getDevicesAction(
  filters: DeviceFilters = {}
): Promise<PaginatedResponse<Device>> {
  const session = await getSession();
  if (!session) redirect("/login");

  const { search, category, status, department, branch_id, page = 1, per_page = 20 } = filters;
  const skip = (page - 1) * per_page;

  const where: Prisma.DeviceWhereInput = {};
  const AND: Prisma.DeviceWhereInput[] = [];

  if (search) {
    AND.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { serial_number: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { assigned_to: { contains: search, mode: "insensitive" } },
        { asset_tag: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { ip_address: { contains: search, mode: "insensitive" } },
        { mac_address: { contains: search, mode: "insensitive" } },
        { os: { contains: search, mode: "insensitive" } },
        { processor: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (category) AND.push({ category: category as Prisma.EnumDeviceCategoryFilter["equals"] });
  if (status) AND.push({ status: status as Prisma.EnumDeviceStatusFilter["equals"] });
  if (department) AND.push({ department: { equals: department } });
  if (branch_id) AND.push({ branch_id: { equals: branch_id } });

  if (AND.length > 0) where.AND = AND;

  const [rows, total] = await Promise.all([
    prisma.device.findMany({
      where,
      orderBy: { updated_at: "desc" },
      skip,
      take: per_page,
      include: { branch: true },
    }),
    prisma.device.count({ where }),
  ]);

  return serialize({
    data: rows as unknown as Device[],
    total,
    page,
    per_page,
    total_pages: Math.ceil(total / per_page),
  });
}

// ============================================================
// GET DEVICE BY ID
// ============================================================

export async function getDeviceAction(id: string): Promise<Device | null> {
  const session = await getSession();
  if (!session) redirect("/login");

  const device = await prisma.device.findUnique({
    where: { id },
    include: { branch: true },
  });
  return serialize(device as unknown as Device | null);
}

// ============================================================
// CREATE DEVICE
// ============================================================

export async function createDeviceAction(
  _prev: ApiResponse,
  formData: FormData
): Promise<ApiResponse<Device>> {
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

  // Extract _specs_* fields into specs JSON object
  const specs: Record<string, string> = {};
  for (const key of Object.keys(raw)) {
    if (key.startsWith("_specs_")) {
      specs[key.replace("_specs_", "")] = String(raw[key] ?? "");
      delete raw[key];
    }
  }
  (raw as Record<string, unknown>).specs = specs;

  const parsed = deviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const d = parsed.data;

  try {
    const device = await prisma.device.create({
      data: {
        name: d.name,
        category: d.category as DeviceCategory,
        brand: d.brand,
        model: d.model,
        serial_number: d.serial_number,
        asset_tag: d.asset_tag || null,
        status: d.status as DeviceStatus,
        location: d.location,
        department: d.department,
        assigned_to: d.assigned_to || null,
        purchase_date: d.purchase_date ? new Date(d.purchase_date) : null,
        warranty_expiry: d.warranty_expiry ? new Date(d.warranty_expiry) : null,
        ip_address: d.ip_address || null,
        mac_address: d.mac_address || null,
        os: d.os || null,
        os_version: d.os_version || null,
        processor: d.processor || null,
        ram_gb: d.ram_gb ?? null,
        storage_gb: d.storage_gb ?? null,
        antivirus: d.antivirus || null,
        antivirus_updated: d.antivirus_updated ? new Date(d.antivirus_updated) : null,
        antivirus_expiry: d.antivirus_expiry ? new Date(d.antivirus_expiry) : null,
        notes: d.notes || null,
        specs: (d.specs ?? {}) as Prisma.JsonObject,
        branch_id: d.branch_id || null,
        malware_detected: d.malware_detected ?? false,
        last_antivirus_scan: d.last_antivirus_scan ? new Date(d.last_antivirus_scan) : null,
        windows_license_type: d.windows_license_type || null,
        windows_version: d.windows_version || null,
        office_license_type: d.office_license_type || null,
        office_version: d.office_version || null,
        has_pirated_software: d.has_pirated_software ?? false,
        hardware_problems: d.hardware_problems || null,
        software_problems: d.software_problems || null,
        changed_parts: d.changed_parts || null,
        credentials: d.credentials || null,
        created_by: session.id,
      },
    });

    await logAudit(session.id, "CREATE_DEVICE", "device", device.id, { name: d.name }, ip);
    revalidatePath("/dashboard/devices");
    return { success: true, data: serialize(device) as unknown as Device };
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2002") {
      return { success: false, error: "El número de serie ya existe" };
    }
    console.error("Create device error:", err);
    return { success: false, error: "Error al crear equipo" };
  }
}

// ============================================================
// UPDATE DEVICE
// ============================================================

export async function updateDeviceAction(
  id: string,
  _prev: ApiResponse,
  formData: FormData
): Promise<ApiResponse<Device>> {
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

  // Extract _specs_* fields into specs JSON object
  const specs: Record<string, string> = {};
  for (const key of Object.keys(raw)) {
    if (key.startsWith("_specs_")) {
      specs[key.replace("_specs_", "")] = String(raw[key] ?? "");
      delete raw[key];
    }
  }
  (raw as Record<string, unknown>).specs = specs;

  const parsed = deviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: getFirstError(parsed.error) };
  }

  const d = parsed.data;

  try {
    const device = await prisma.device.update({
      where: { id },
      data: {
        name: d.name,
        category: d.category as DeviceCategory,
        brand: d.brand,
        model: d.model,
        serial_number: d.serial_number,
        asset_tag: d.asset_tag || null,
        status: d.status as DeviceStatus,
        location: d.location,
        department: d.department,
        assigned_to: d.assigned_to || null,
        purchase_date: d.purchase_date ? new Date(d.purchase_date) : null,
        warranty_expiry: d.warranty_expiry ? new Date(d.warranty_expiry) : null,
        ip_address: d.ip_address || null,
        mac_address: d.mac_address || null,
        os: d.os || null,
        os_version: d.os_version || null,
        processor: d.processor || null,
        ram_gb: d.ram_gb ?? null,
        storage_gb: d.storage_gb ?? null,
        antivirus: d.antivirus || null,
        antivirus_updated: d.antivirus_updated ? new Date(d.antivirus_updated) : null,
        antivirus_expiry: d.antivirus_expiry ? new Date(d.antivirus_expiry) : null,
        notes: d.notes || null,
        specs: (d.specs ?? {}) as Prisma.JsonObject,
        branch_id: d.branch_id || null,
        malware_detected: d.malware_detected ?? false,
        last_antivirus_scan: d.last_antivirus_scan ? new Date(d.last_antivirus_scan) : null,
        windows_license_type: d.windows_license_type || null,
        windows_version: d.windows_version || null,
        office_license_type: d.office_license_type || null,
        office_version: d.office_version || null,
        has_pirated_software: d.has_pirated_software ?? false,
        hardware_problems: d.hardware_problems || null,
        software_problems: d.software_problems || null,
        changed_parts: d.changed_parts || null,
        credentials: d.credentials || null,
      },
    });

    await logAudit(session.id, "UPDATE_DEVICE", "device", id, { name: d.name }, ip);
    revalidatePath("/dashboard/devices");
    revalidatePath(`/dashboard/devices/${id}`);
    return { success: true, data: serialize(device) as unknown as Device };
  } catch (err) {
    console.error("Update device error:", err);
    return { success: false, error: "Error al actualizar equipo" };
  }
}

// ============================================================
// DELETE DEVICE
// ============================================================

export async function deleteDeviceAction(id: string): Promise<ApiResponse> {
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
    await prisma.device.delete({ where: { id } });
    await logAudit(session.id, "DELETE_DEVICE", "device", id, undefined, ip);
    revalidatePath("/dashboard/devices");
    return { success: true, message: "Equipo eliminado" };
  } catch (err) {
    console.error("Delete device error:", err);
    return { success: false, error: "Error al eliminar equipo" };
  }
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [counts, byCategory, byDepartment, recentMaintenance, criticalDevices, maintenanceCounts, byBranch, allBranches] =
    await Promise.all([
      prisma.device.aggregate({
        _count: { _all: true },
      }),
      prisma.device.groupBy({
        by: ["category"],
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
      }),
      prisma.device.groupBy({
        by: ["department"],
        _count: { department: true },
        orderBy: { _count: { department: "desc" } },
      }),
      prisma.maintenanceRecord.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: {
          device: {
            select: {
              name: true,
              branch: { select: { name: true } },
            },
          },
          technician: { select: { name: true } },
        },
      }),
      prisma.device.findMany({
        where: { status: { in: ["damaged", "maintenance"] } },
        take: 5,
        include: { branch: true },
      }),
      prisma.maintenanceRecord.groupBy({
        by: ["status"],
        _count: { status: true },
        where: {
          OR: [
            { status: "scheduled" },
            { status: "completed", completed_date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
          ],
        },
      }),
      prisma.device.groupBy({
        by: ["branch_id"],
        _count: { branch_id: true },
        orderBy: { _count: { branch_id: "desc" } },
      }),
      prisma.branch.findMany(),
    ]);

  // Get total count properly
  const totalDevices = await prisma.device.count();

  // Count individual statuses
  const [activeDevices, maintenanceDevices, retiredDevices] = await Promise.all([
    prisma.device.count({ where: { status: "active" } }),
    prisma.device.count({ where: { status: "maintenance" } }),
    prisma.device.count({ where: { status: "retired" } }),
  ]);

  // New dashboard counts
  const [damagedDevices, noAntivirus, malwareDetectedCount, overdueMaintenance] = await Promise.all([
    prisma.device.count({ where: { status: "damaged" } }),
    prisma.device.count({ where: { antivirus: null } }),
    prisma.device.count({ where: { malware_detected: true } }),
    prisma.device.count({
      where: {
        next_maintenance: { lt: now },
        status: { not: "retired" },
      },
    }),
  ]);

  // Count expiring warranties and antivirus
  const [expiringWarranties, expiringAntivirus] = await Promise.all([
    prisma.device.count({
      where: {
        warranty_expiry: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
    prisma.device.count({
      where: {
        antivirus_expiry: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
  ]);

  const pendingMaint = maintenanceCounts.find((m) => m.status === "scheduled");
  const completedMaint = maintenanceCounts.find(
    (m) => m.status === "completed"
  );

  return serialize({
    total_devices: totalDevices,
    active_devices: activeDevices,
    maintenance_devices: maintenanceDevices,
    damaged_devices: damagedDevices,
    retired_devices: retiredDevices,
    expiring_warranties: expiringWarranties,
    expiring_antivirus: expiringAntivirus,
    no_antivirus: noAntivirus,
    malware_detected: malwareDetectedCount,
    pending_maintenance: pendingMaint?._count.status ?? 0,
    completed_maintenance_month: completedMaint?._count.status ?? 0,
    by_category: Object.fromEntries(
      byCategory.map((r: { category: string; _count: { category: number } }) => [r.category, r._count.category])
    ),
    by_department: Object.fromEntries(
      byDepartment.map((r: { department: string; _count: { department: number } }) => [r.department, r._count.department])
    ),
    by_branch: Object.fromEntries(
      byBranch.map((r: { branch_id: string | null; _count: { branch_id: number } }) => [r.branch_id ?? "", r._count.branch_id])
    ),
    branch_names: Object.fromEntries(
      allBranches.map((b: { id: string; name: string }) => [b.id, b.name])
    ),
    recent_maintenance: recentMaintenance.map((m) => {
      const record = m as unknown as {
        device: { name: string; branch: { name: string } | null };
        technician: { name: string } | null;
      };
      return {
        ...m,
        device_name: record.device?.name,
        technician_name: record.technician?.name,
        branch_name: record.device?.branch?.name,
      };
    }) as unknown as DashboardStats["recent_maintenance"],
    critical_devices: criticalDevices,
    overdue_maintenance: overdueMaintenance,
  }) as unknown as DashboardStats;
}
