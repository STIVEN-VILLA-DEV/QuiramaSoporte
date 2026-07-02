// ============================================================
// TICKETS & NOTIFICATIONS TYPES
// ============================================================

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface SupportTicket {
  id: string;
  employee_name: string;
  employee_email: string;
  branch_name: string;
  department: string;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to?: string;
  assigned_user?: { id: string; name: string; email: string };
  created_at: string;
  updated_at: string;
}

export interface TicketFormData {
  employee_name: string;
  employee_email: string;
  branch_name: string;
  department: string;
  category: string;
  subject: string;
  description: string;
}


