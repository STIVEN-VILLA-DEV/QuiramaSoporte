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
