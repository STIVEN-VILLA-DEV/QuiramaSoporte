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

// ── Per-category specs Zod schemas ──────────────────────

export const computerSpecSchema = z.object({
  storage_type: z.enum(["hdd", "ssd", "nvme"]).optional(),
  gpu: z.string().max(255).trim().optional(),
  form_factor: z.enum(["tower", "mini", "all-in-one"]).optional(),
  motherboard: z.string().max(255).trim().optional(),
});

export const laptopSpecSchema = z.object({
  storage_type: z.enum(["hdd", "ssd", "nvme"]).optional(),
  gpu: z.string().max(255).trim().optional(),
  screen_size: z.string().max(50).trim().optional(),
  battery_health: z.string().max(100).trim().optional(),
});

export const printerSpecSchema = z.object({
  printer_type: z.enum(["laser", "inkjet", "thermal", "dot_matrix"]).optional(),
  connectivity: z.string().max(255).trim().optional(),
  duplex: z.coerce.boolean().optional(),
  color: z.coerce.boolean().optional(),
  pages_printed: z.coerce.number().int().min(0).optional(),
  ink_type: z.string().max(255).trim().optional(),
  paper_size: z.string().max(100).trim().optional(),
  printer_shared: z.coerce.boolean().optional(),
  connection_type: z.enum(["usb", "network", "wifi"]).optional(),
  shared_from: z.string().max(255).trim().optional(),
});

export const phoneSpecSchema = z.object({
  imei: z.string().max(50).trim().optional(),
  carrier: z.string().max(255).trim().optional(),
  line_number: z.string().max(50).trim().optional(),
  phone_storage_gb: z.coerce.number().int().min(0).max(10000).optional(),
  phone_ram_gb: z.coerce.number().int().min(0).max(10000).optional(),
  screen_size: z.string().max(50).trim().optional(),
  battery_health: z.string().max(100).trim().optional(),
});

export const networkSpecSchema = z.object({
  net_type: z.enum(["router", "switch", "access_point", "modem", "firewall", "patch_panel"]).optional(),
  ports: z.coerce.number().int().min(0).max(500).optional(),
  speed: z.string().max(50).trim().optional(),
  managed: z.coerce.boolean().optional(),
  poe: z.coerce.boolean().optional(),
  rack_mounted: z.coerce.boolean().optional(),
  firmware_version: z.string().max(100).trim().optional(),
});

export const cameraSpecSchema = z.object({
  resolution: z.string().max(50).trim().optional(),
  cam_type: z.enum(["ip", "analog", "ptz", "dome", "bullet"]).optional(),
  night_vision: z.coerce.boolean().optional(),
  audio: z.coerce.boolean().optional(),
  storage: z.string().max(255).trim().optional(),
  nvr_dvr: z.string().max(255).trim().optional(),
});

export const paymentTerminalSpecSchema = z.object({
  terminal_brand: z.string().max(255).trim().optional(),
  terminal_model: z.string().max(255).trim().optional(),
  carrier: z.string().max(255).trim().optional(),
  line_number: z.string().max(50).trim().optional(),
  sim_card: z.string().max(50).trim().optional(),
  bank: z.string().max(255).trim().optional(),
});

export const serverSpecSchema = z.object({
  server_processor: z.string().max(255).trim().optional(),
  server_ram_gb: z.coerce.number().int().min(0).max(1000000).optional(),
  server_storage_gb: z.coerce.number().int().min(0).max(10000000).optional(),
  storage_type: z.enum(["hdd", "ssd", "nvme", "sas"]).optional(),
  raid: z.string().max(50).trim().optional(),
  server_form_factor: z.enum(["rack", "tower", "blade"]).optional(),
  virtualization: z.string().max(255).trim().optional(),
});

export const tabletSpecSchema = z.object({
  imei: z.string().max(50).trim().optional(),
  tablet_storage_gb: z.coerce.number().int().min(0).max(10000).optional(),
  tablet_ram_gb: z.coerce.number().int().min(0).max(10000).optional(),
  screen_size: z.string().max(50).trim().optional(),
  has_keyboard: z.coerce.boolean().optional(),
  has_stylus: z.coerce.boolean().optional(),
});

export const scannerSpecSchema = z.object({
  scan_type: z.enum(["flatbed", "adf", "handheld"]).optional(),
  scan_resolution: z.string().max(50).trim().optional(),
  duplex: z.coerce.boolean().optional(),
  scan_speed: z.string().max(50).trim().optional(),
});

export const upsSpecSchema = z.object({
  capacity_va: z.coerce.number().int().min(0).max(100000).optional(),
  capacity_w: z.coerce.number().int().min(0).max(100000).optional(),
  battery_count: z.coerce.number().int().min(0).max(100).optional(),
  runtime_min: z.coerce.number().int().min(0).max(10000).optional(),
  outlets: z.coerce.number().int().min(0).max(50).optional(),
  ups_rack_mounted: z.coerce.boolean().optional(),
});

export const categorySpecSchemas: Record<string, z.ZodTypeAny> = {
  computer: computerSpecSchema,
  laptop: laptopSpecSchema,
  printer: printerSpecSchema,
  phone: phoneSpecSchema,
  network: networkSpecSchema,
  camera: cameraSpecSchema,
  payment_terminal: paymentTerminalSpecSchema,
  server: serverSpecSchema,
  tablet: tabletSpecSchema,
  scanner: scannerSpecSchema,
  ups: upsSpecSchema,
  other: z.record(z.string(), z.any()).optional(),
};

// ── Coerce specs values from form data strings ────────

function coerceSpecs(val: unknown): Record<string, string | number | boolean> {
  if (!val || typeof val !== "object") return {};
  const obj = val as Record<string, unknown>;
  const result: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined || v === null) continue;
    if (typeof v === "string") {
      if (v === "true") result[k] = true;
      else if (v === "false") result[k] = false;
      else if (v !== "" && !isNaN(Number(v)) && v.trim() !== "") {
        const n = Number(v);
        result[k] = Number.isInteger(n) ? n : n;
      } else {
        result[k] = v;
      }
    } else {
      result[k] = v as string | number | boolean;
    }
  }
  return result;
}

// ── Base device schema ────────────────────────────────

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
  specs: z
    .preprocess(coerceSpecs, z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])))
    .optional()
    .default({}),
}).superRefine((data, ctx) => {
  const specsSchema = categorySpecSchemas[data.category];
  if (specsSchema && data.specs) {
    const result = specsSchema.safeParse(data.specs);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["specs", ...issue.path],
        });
      }
    }
  }
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
  branch_name: z.string().min(1, "La sede es requerida").max(100).trim(),
  department: z.string().min(1, "El departamento es requerido").max(255).trim(),
  category: z.string().min(1, "La categoría es requerida"),
  subject: z.string().min(1, "El asunto es requerido").max(255).trim(),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").max(5000).trim(),
  is_blocking: z.coerce.boolean(),
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
