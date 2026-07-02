// ============================================================
// CORE ENTITY TYPES
// ============================================================

export type DeviceCategory =
  | "computer"
  | "laptop"
  | "printer"
  | "camera"
  | "payment_terminal"
  | "server"
  | "network"
  | "phone"
  | "tablet"
  | "scanner"
  | "ups"
  | "other";

export type DeviceStatus = "active" | "inactive" | "maintenance" | "retired" | "damaged";

export type MaintenanceType = "preventive" | "corrective" | "upgrade" | "inspection";

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type Priority = "low" | "medium" | "high" | "critical";

export type UserRole = "admin" | "technician" | "viewer";

export type BranchName = "CEDROS" | "CRISTALES" | "CDA" | "QUIRAMA";

// ============================================================
// BRANCH
// ============================================================

export interface Branch {
  id: string;
  name: BranchName;
  slug: string;
}

// ============================================================
// USER
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branch_id?: string;
  branch?: Branch;
  department?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branch_id?: string;
}

// ============================================================
// DEVICE
// ============================================================

export interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  serial_number: string;
  asset_tag?: string;
  status: DeviceStatus;
  branch_id?: string;
  branch?: Branch;
  location: string;
  department: string;
  assigned_to?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  ip_address?: string;
  mac_address?: string;
  os?: string;
  os_version?: string;
  processor?: string;
  ram_gb?: number;
  storage_gb?: number;
  antivirus?: string;
  antivirus_updated?: string;
  antivirus_expiry?: string;
  malware_detected?: boolean;
  has_antivirus?: boolean;
  last_antivirus_scan?: string;
  windows_license_type?: string;
  windows_version?: string;
  office_license_type?: string;
  office_version?: string;
  has_pirated_software?: boolean;
  hardware_problems?: string;
  software_problems?: string;
  changed_parts?: string;
  credentials?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  notes?: string;
  specs: Record<string, string | number | boolean>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ============================================================
// PER-CATEGORY DEVICE SPECS
// ============================================================

export interface PcSpecs {
  storage_type?: "hdd" | "ssd" | "nvme" | "hdd+ssd";
  gpu?: string;
  form_factor?: "tower" | "mini" | "desktop" | "all-in-one" | "rack" | "micro" | "other";
  motherboard?: string;
}

export interface LaptopSpecs {
  storage_type?: "hdd" | "ssd" | "nvme" | "hdd+ssd";
  gpu?: string;
  screen_size?: string;
  battery_health?: string;
}

export interface PrinterSpecs {
  printer_type?: "laser" | "inkjet" | "thermal" | "dot_matrix" | "other";
  connectivity?: string;
  duplex?: boolean;
  color?: boolean;
  pages_printed?: number;
  ink_type?: string;
  paper_size?: string;
  printer_shared?: boolean;
  connection_type?: "usb" | "network" | "wifi";
  shared_from?: string;
}

export interface PhoneSpecs {
  imei?: string;
  carrier?: string;
  line_number?: string;
  phone_storage_gb?: number;
  phone_ram_gb?: number;
  screen_size?: string;
  battery_health?: string;
}

export interface NetworkSpecs {
  net_type?: "router" | "switch" | "access_point" | "modem" | "firewall" | "patch_panel";
  ports?: number;
  speed?: string;
  managed?: boolean;
  poe?: boolean;
  rack_mounted?: boolean;
  firmware_version?: string;
}

export interface CameraSpecs {
  resolution?: string;
  cam_type?: "ip" | "analog" | "ptz" | "dome" | "bullet";
  night_vision?: boolean;
  audio?: boolean;
  storage?: string;
  nvr_dvr?: string;
}

export interface PaymentTerminalSpecs {
  terminal_brand?: string;
  terminal_model?: string;
  carrier?: string;
  line_number?: string;
  sim_card?: string;
  bank?: string;
}

export interface ServerSpecs {
  server_processor?: string;
  server_ram_gb?: number;
  server_storage_gb?: number;
  storage_type?: "hdd" | "ssd" | "nvme" | "sas";
  raid?: string;
  server_form_factor?: "rack" | "tower" | "blade";
  virtualization?: string;
}

export interface TabletSpecs {
  imei?: string;
  tablet_storage_gb?: number;
  tablet_ram_gb?: number;
  screen_size?: string;
  has_keyboard?: boolean;
  has_stylus?: boolean;
}

export interface ScannerSpecs {
  scan_type?: "flatbed" | "adf" | "handheld";
  scan_resolution?: string;
  duplex?: boolean;
  scan_speed?: string;
}

export interface UpsSpecs {
  capacity_va?: number;
  capacity_w?: number;
  battery_count?: number;
  runtime_min?: number;
  outlets?: number;
  ups_rack_mounted?: boolean;
}

export type DeviceSpecs =
  | PcSpecs
  | LaptopSpecs
  | PrinterSpecs
  | PhoneSpecs
  | NetworkSpecs
  | CameraSpecs
  | PaymentTerminalSpecs
  | ServerSpecs
  | TabletSpecs
  | ScannerSpecs
  | UpsSpecs;

// ── Map category → specs key for dynamic access ──────

export const categorySpecMap: Record<
  DeviceCategory,
  keyof typeof specFieldLabels
> = {
  computer: "pc",
  laptop: "laptop",
  printer: "printer",
  phone: "phone",
  network: "network",
  camera: "camera",
  payment_terminal: "payment_terminal",
  server: "server",
  tablet: "tablet",
  scanner: "scanner",
  ups: "ups",
  other: "pc",
};

// ── Human-readable labels for each specs field ────────

export const specFieldLabels: Record<string, Record<string, string>> = {
  pc: {
    storage_type: "Tipo de almacenamiento",
    gpu: "GPU / Tarjeta gráfica",
    form_factor: "Factor de forma",
    motherboard: "Placa madre",
  },
  laptop: {
    storage_type: "Tipo de almacenamiento",
    gpu: "GPU",
    screen_size: "Tamaño de pantalla",
    battery_health: "Estado de batería",
  },
  printer: {
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
  },
  phone: {
    imei: "IMEI",
    carrier: "Operador / Compañía",
    line_number: "Número de línea",
    phone_storage_gb: "Almacenamiento (GB)",
    phone_ram_gb: "RAM (GB)",
    screen_size: "Tamaño de pantalla",
    battery_health: "Estado de batería",
  },
  network: {
    net_type: "Tipo de equipo",
    ports: "Cantidad de puertos",
    speed: "Velocidad",
    managed: "Administrable (Managed)",
    poe: "PoE (Power over Ethernet)",
    rack_mounted: "Montaje en rack",
    firmware_version: "Versión de firmware",
  },
  camera: {
    resolution: "Resolución",
    cam_type: "Tipo de cámara",
    night_vision: "Visión nocturna",
    audio: "Audio",
    storage: "Almacenamiento",
    nvr_dvr: "NVR / DVR asociado",
  },
  payment_terminal: {
    terminal_brand: "Marca del datáfono",
    terminal_model: "Modelo",
    carrier: "Operador SIM",
    line_number: "Número de línea",
    sim_card: "SIM card",
    bank: "Banco adquirente",
  },
  server: {
    server_processor: "Procesador",
    server_ram_gb: "RAM (GB)",
    server_storage_gb: "Almacenamiento (GB)",
    storage_type: "Tipo de almacenamiento",
    raid: "RAID",
    server_form_factor: "Factor de forma",
    virtualization: "Virtualización",
  },
  tablet: {
    imei: "IMEI",
    tablet_storage_gb: "Almacenamiento (GB)",
    tablet_ram_gb: "RAM (GB)",
    screen_size: "Tamaño de pantalla",
    has_keyboard: "Teclado físico",
    has_stylus: "Lápiz / Stylus",
  },
  scanner: {
    scan_type: "Tipo de escáner",
    scan_resolution: "Resolución",
    duplex: "Dúplex",
    scan_speed: "Velocidad",
  },
  ups: {
    capacity_va: "Capacidad (VA)",
    capacity_w: "Capacidad (Watts)",
    battery_count: "Cantidad de baterías",
    runtime_min: "Autonomía (minutos)",
    outlets: "Salidas",
    ups_rack_mounted: "Montaje en rack",
  },
};

export interface DeviceFormData {
  name: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  serial_number: string;
  asset_tag?: string;
  status: DeviceStatus;
  branch_id?: string;
  location: string;
  department: string;
  assigned_to?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  ip_address?: string;
  mac_address?: string;
  os?: string;
  os_version?: string;
  processor?: string;
  ram_gb?: number;
  storage_gb?: number;
  antivirus?: string;
  antivirus_updated?: string;
  antivirus_expiry?: string;
  malware_detected?: boolean;
  has_antivirus?: boolean;
  last_antivirus_scan?: string;
  windows_license_type?: string;
  windows_version?: string;
  office_license_type?: string;
  office_version?: string;
  has_pirated_software?: boolean;
  hardware_problems?: string;
  software_problems?: string;
  changed_parts?: string;
  credentials?: string;
  notes?: string;
  specs?: Record<string, string | number | boolean>;
}

// ============================================================
// MAINTENANCE
// ============================================================

export interface MaintenanceRecord {
  id: string;
  device_id: string;
  device_name?: string;
  branch_name?: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: Priority;
  title: string;
  description: string;
  scheduled_date?: string;
  completed_date?: string;
  technician_id?: string;
  technician_name?: string;
  cost?: number;
  parts_used?: string;
  findings?: string;
  next_maintenance?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface MaintenanceFormData {
  device_id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: Priority;
  title: string;
  description: string;
  scheduled_date?: string;
  technician_id?: string;
  cost?: number;
  parts_used?: string;
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export interface DashboardStats {
  total_devices: number;
  active_devices: number;
  maintenance_devices: number;
  damaged_devices: number;
  retired_devices: number;
  pending_maintenance: number;
  completed_maintenance_month: number;
  expiring_warranties: number;
  expiring_antivirus: number;
  no_antivirus: number;
  total_computer_like: number;
  malware_detected: number;
  by_category: Record<string, number>;
  by_branch: Record<string, number>;
  branch_names: Record<string, string>;
  by_department: Record<string, number>;
  recent_maintenance: MaintenanceRecord[];
  critical_devices: Device[];
  overdue_maintenance: number;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: Notification[];
  alerts: {
    expiring_warranties: number;
    expiring_antivirus: number;
    pending_maintenance: number;
    overdue_maintenance: number;
  };
}

// ============================================================
// API RESPONSES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================
// FILTERS
// ============================================================

export interface DeviceFilters {
  search?: string;
  category?: DeviceCategory;
  status?: DeviceStatus;
  branch_id?: string;
  department?: string;
  page?: number;
  per_page?: number;
}

export interface MaintenanceFilters {
  search?: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  priority?: Priority;
  device_id?: string;
  page?: number;
  per_page?: number;
}

export * from "./tickets";
