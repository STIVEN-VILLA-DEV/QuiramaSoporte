"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma, serialize } from "@/lib/prisma";
import { logAudit } from "@/lib/db";
import { getSession, canWrite } from "@/lib/auth";
import { deviceSchema, getFirstError } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { ApiResponse, Device, PaginatedResponse, DeviceFilters, DeviceCategory, DeviceStatus } from "@/types";
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
        has_antivirus: d.has_antivirus ?? false,
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
        has_antivirus: d.has_antivirus ?? false,
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
