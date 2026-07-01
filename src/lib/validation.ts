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
// Only convert "true"/"false" to booleans. Keep everything else as strings.
// z.coerce.number() and z.coerce.boolean() in the schemas handle coercion from strings.

function coerceSpecs(val: unknown): Record<string, string | number | boolean> {
  if (!val || typeof val !== "object") return {};
  const obj = val as Record<string, unknown>;
  const result: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined || v === null) continue;
    if (typeof v === "string") {
      if (v === "true") result[k] = true;
      else if (v === "false") result[k] = false;
      else result[k] = v; // keep as string — let z.coerce.number() / z.coerce.boolean() handle it
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
  has_antivirus: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
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
  is_blocking: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on"),
});

// ── Friendly field labels for error messages ──────────

const fieldLabels: Record<string, string> = {
  name: "Nombre del equipo",
  category: "Categoría",
  brand: "Marca",
  model: "Modelo",
  serial_number: "Número de serie",
  asset_tag: "Código de activo",
  status: "Estado",
  branch_id: "Sede",
  location: "Ubicación",
  department: "Departamento",
  assigned_to: "Asignado a",
  purchase_date: "Fecha de compra",
  warranty_expiry: "Vencimiento de garantía",
  ip_address: "Dirección IP",
  mac_address: "Dirección MAC",
  os: "Sistema operativo",
  os_version: "Versión del SO",
  processor: "Procesador",
  ram_gb: "RAM (GB)",
  storage_gb: "Almacenamiento (GB)",
  antivirus: "Antivirus",
  antivirus_updated: "Antivirus actualizado hasta",
  antivirus_expiry: "Vencimiento antivirus",
  malware_detected: "Malware detectado",
  has_antivirus: "Tiene antivirus",
  last_antivirus_scan: "Último escaneo",
  windows_license_type: "Licencia de Windows",
  windows_version: "Versión de Windows",
  office_license_type: "Licencia de Office",
  office_version: "Versión de Office",
  has_pirated_software: "Software pirata",
  hardware_problems: "Problemas de hardware",
  software_problems: "Problemas de software",
  changed_parts: "Piezas cambiadas",
  credentials: "Credenciales",
  notes: "Notas",
  storage_type: "Tipo de almacenamiento",
  gpu: "GPU / Tarjeta gráfica",
  form_factor: "Factor de forma",
  motherboard: "Placa madre",
  screen_size: "Tamaño de pantalla",
  battery_health: "Estado de batería",
  printer_type: "Tipo de impresora",
  connectivity: "Conectividad",
  duplex: "Dúplex (doble cara)",
  color: "Impresión a color",
  pages_printed: "Páginas impresas",
  ink_type: "Tipo de tinta / tóner",
  paper_size: "Tamaño de papel",
  printer_shared: "Compartida en red",
  connection_type: "Tipo de conexión",
  shared_from: "Compartida desde equipo",
  imei: "IMEI",
  carrier: "Operador / Compañía",
  line_number: "Número de línea",
  phone_storage_gb: "Almacenamiento (GB)",
  phone_ram_gb: "RAM (GB)",
  net_type: "Tipo de equipo",
  ports: "Cantidad de puertos",
  speed: "Velocidad",
  managed: "Administrable (Managed)",
  poe: "PoE (Power over Ethernet)",
  rack_mounted: "Montaje en rack",
  firmware_version: "Versión de firmware",
  resolution: "Resolución",
  cam_type: "Tipo de cámara",
  night_vision: "Visión nocturna",
  audio: "Audio",
  storage: "Almacenamiento",
  nvr_dvr: "NVR / DVR asociado",
  terminal_brand: "Marca del datáfono",
  terminal_model: "Modelo",
  sim_card: "SIM card",
  bank: "Banco adquirente",
  server_processor: "Procesador",
  server_ram_gb: "RAM (GB)",
  server_storage_gb: "Almacenamiento (GB)",
  raid: "RAID",
  server_form_factor: "Factor de forma",
  virtualization: "Virtualización",
  tablet_storage_gb: "Almacenamiento (GB)",
  tablet_ram_gb: "RAM (GB)",
  has_keyboard: "Teclado incluido",
  has_stylus: "Lápiz / Stylus incluido",
  scan_type: "Tipo de escáner",
  scan_resolution: "Resolución de escaneo",
  scan_speed: "Velocidad de escaneo",
  capacity_va: "Capacidad (VA)",
  capacity_w: "Capacidad (W)",
  battery_count: "Cantidad de baterías",
  runtime_min: "Autonomía (minutos)",
  outlets: "Salidas",
  ups_rack_mounted: "Montaje en rack",
  employee_name: "Nombre del empleado",
  branch_name: "Sede",
  subject: "Asunto",
  description: "Descripción",
  is_blocking: "Bloquea tu trabajo",
};

// ── Friendly Zod message overrides ────────────────────

const friendlyMessages: Record<string, string> = {
  "Required": "es requerido",
  "Expected string, received number": "debe ser texto, no un número",
  "Expected number, received string": "debe ser un número",
  "Expected boolean, received string": "debe ser Sí o No",
  "Invalid enum value": "valor no válido",
  "String must contain at most": "es demasiado largo (máximo",
};

function friendlyFieldPath(path: (string | number | symbol)[]): string {
  if (path.length === 0) return "Formulario";
  // specs › screen_size → "Tamaño de pantalla"
  // Just name → "Nombre del equipo"
  const last = String(path[path.length - 1]);
  return fieldLabels[last] ?? last;
}

function friendlyMessage(message: string): string {
  for (const [key, val] of Object.entries(friendlyMessages)) {
    if (message.startsWith(key)) return val;
  }
  return message;
}

// ============================================================
// GET FIRST VALIDATION ERROR
// ============================================================

export function getFirstError(err: z.ZodError): string {
  const issues = err.issues ?? (err as unknown as { errors: z.ZodIssue[] }).errors ?? [];
  const first = issues[0];
  if (!first) return "Error de validación";
  const label = friendlyFieldPath(first.path);
  const msg = friendlyMessage(first.message);
  return `${label}: ${msg}`;
}

export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
