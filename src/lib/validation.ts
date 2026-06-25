import { z } from "zod";

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
});

export const registerSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128)
    .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
    .regex(/[0-9]/, "Debe tener al menos un número"),
  name: z.string().min(2).max(255).trim(),
  role: z.enum(["admin", "technician", "viewer"]).default("viewer"),
  branch_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined),
  department: z.string().max(255).optional(),
});

// ============================================================
// DEVICE SCHEMAS
// ============================================================

export const deviceSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(255).trim(),
  category: z.enum([
    "computer", "laptop", "printer", "camera", "payment_terminal",
    "server", "network", "phone", "tablet", "scanner", "ups", "other",
  ]),
  brand: z.string().min(1, "Marca requerida").max(255).trim(),
  model: z.string().min(1, "Modelo requerido").max(255).trim(),
  serial_number: z.string().min(1, "Número de serie requerido").max(255).trim(),
  asset_tag: z.string().max(100).trim().optional(),
  status: z.enum(["active", "inactive", "maintenance", "retired", "damaged"]),
  branch_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined),
  location: z.string().min(1, "Ubicación requerida").max(255).trim(),
  department: z.string().min(1, "Departamento requerido").max(255).trim(),
  assigned_to: z.string().max(255).trim().optional(),
  purchase_date: z.string().optional(),
  warranty_expiry: z.string().optional(),
  ip_address: z.string().max(45).optional(),
  mac_address: z.string().max(17).optional(),
  os: z.string().max(255).trim().optional(),
  os_version: z.string().max(100).trim().optional(),
  processor: z.string().max(255).trim().optional(),
  ram_gb: z.coerce.number().int().min(0).max(10000).optional(),
  storage_gb: z.coerce.number().int().min(0).max(1000000).optional(),
  antivirus: z.string().max(255).trim().optional(),
  antivirus_updated: z.string().optional(),
  antivirus_expiry: z.string().optional(),
  malware_detected: z.coerce.boolean().optional(),
  last_antivirus_scan: z.string().optional(),
  windows_license_type: z.enum(["kms", "original", "none", ""]).optional().default(""),
  windows_version: z.string().max(100).trim().optional(),
  office_license_type: z.enum(["kms", "original", "none", ""]).optional().default(""),
  office_version: z.string().max(100).trim().optional(),
  has_pirated_software: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  hardware_problems: z.string().max(2000).trim().optional(),
  software_problems: z.string().max(2000).trim().optional(),
  changed_parts: z.string().max(2000).trim().optional(),
  credentials: z.string().max(2000).trim().optional(),
  notes: z.string().max(2000).trim().optional(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// ============================================================
// MAINTENANCE SCHEMAS
// ============================================================

export const maintenanceSchema = z.object({
  device_id: z.string().min(1, "ID de equipo requerido"),
  type: z.enum(["preventive", "corrective", "upgrade", "inspection"]),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1, "Título requerido").max(255).trim(),
  description: z.string().min(1, "Descripción requerida").max(2000).trim(),
  scheduled_date: z.string().optional(),
  technician_id: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  parts_used: z.string().max(1000).trim().optional(),
  findings: z.string().max(2000).trim().optional(),
  next_maintenance: z.string().optional(),
});

// ============================================================
// PUBLIC TICKET SCHEMA (no auth required)
// ============================================================

export const publicTicketSchema = z.object({
  employee_name: z.string().min(1, "El nombre es requerido").max(255).trim(),
  employee_email: z.string().email("Email inválido").max(255).transform((v) => v.toLowerCase().trim()),
  branch_name: z.string().min(1, "La sede es requerida").max(100).trim(),
  department: z.string().min(1, "El departamento es requerido").max(255).trim(),
  category: z.string().min(1, "La categoría es requerida"),
  subject: z.string().min(1, "El asunto es requerido").max(255).trim(),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").max(5000).trim(),
});

// ============================================================
// GET FIRST ZOD ERROR (compatible v3/v4)
// ============================================================

export function getFirstError(err: z.ZodError): string {
  const issues = err.issues ?? (err as unknown as { errors: z.ZodIssue[] }).errors ?? [];
  return issues[0]?.message ?? "Error de validación";
}

export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
