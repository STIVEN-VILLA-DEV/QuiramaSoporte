"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { publicTicketSchema } from "@/lib/validation";
import { checkTicketRateLimit, getClientIp } from "@/lib/rate-limit";

// ============================================================
// SUBMIT PUBLIC TICKET (no auth required)
// ============================================================

export async function submitPublicTicketAction(
  _prev: { success: boolean; message?: string; error?: string; ticketId?: string },
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string; ticketId?: string }> {
  try {
    // 1. Get client IP
    const headersList = await headers();
    const ip = getClientIp(headersList);

    // 2. Honeypot check — silent success WITHOUT incrementing rate limit
    const gotcha = formData.get("_gotcha");
    if (gotcha && typeof gotcha === "string" && gotcha.trim().length > 0) {
      // Bot detected — return fake success to not alert the bot
      return { success: true, message: "Reporte enviado con éxito. Pronto recibirás una respuesta." };
    }

    // 3. Rate limit check (fail fast)
    const limit = await checkTicketRateLimit(ip);
    if (!limit.allowed) {
      return { success: false, error: limit.message };
    }

    // 4. Validate with Zod
    const raw = Object.fromEntries(formData);
    const parsed = publicTicketSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues ?? (parsed.error as unknown as { errors: typeof parsed.error.issues }).errors ?? [];
      const firstError = issues[0]?.message || "Datos inválidos";
      return { success: false, error: firstError };
    }

    const data = parsed.data;

    // 5. Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        employee_name: data.employee_name,
        branch_name: data.branch_name,
        department: data.department,
        category: data.category,
        subject: data.subject,
        description: data.description,
        is_blocking: data.is_blocking,
        ip_address: ip,
      },
    });

    // 6. Broadcast notification to all admin/technician users
    try {
      const recipients = await prisma.user.findMany({
        where: { role: { in: ["admin", "technician"] }, is_active: true },
        select: { id: true, email: true, name: true },
      });

      if (recipients.length > 0) {
        // Create in-app notifications
        await prisma.notification.createMany({
          data: recipients.map((u) => ({
            user_id: u.id,
            type: "ticket_created",
            title: "Nuevo reporte de soporte",
            message: `${data.employee_name} reportó: ${data.subject}`,
            link: `/dashboard/tickets/${ticket.id}`,
          })),
        });

        // Send email notifications (non-blocking)
        const emails = recipients.map((u) => u.email).filter(Boolean) as string[];
        if (emails.length > 0) {
          const { sendEmail, buildTicketEmailHtml } = await import("@/lib/email");
          const html = buildTicketEmailHtml({
            id: ticket.id,
            employee_name: data.employee_name,
            branch_name: data.branch_name,
            department: data.department,
            category: data.category,
            subject: data.subject,
            description: data.description,
            is_blocking: data.is_blocking,
          });
          sendEmail({ to: emails, subject: `Nuevo ticket: ${data.subject}`, html }).catch((err) =>
            console.error("[email] send error:", err)
          );
        }
      }
    } catch (notifErr) {
      // Non-critical — don't fail the ticket creation if notification fails
      console.error("Failed to create notifications/emails:", notifErr);
    }

    revalidatePath("/dashboard/tickets");
    return { success: true, message: "Reporte enviado con éxito. Pronto recibirás una respuesta.", ticketId: ticket.id };
  } catch (err) {
    console.error("submitPublicTicketAction error:", err);
    return { success: false, error: "Error al enviar el reporte. Intenta de nuevo." };
  }
}

// ============================================================
// LIST TICKETS (auth required)
// ============================================================

export async function getTicketsAction(params?: {
  status?: string;
  page?: number;
  perPage?: number;
}) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return { success: false, error: "No autenticado", data: [], total: 0 };

  const { status, page = 1, perPage = 20 } = params ?? {};
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: perPage,
      include: { assigned_user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    success: true,
    data: JSON.parse(JSON.stringify(data)),
    total,
    page,
    perPage,
  };
}

// ============================================================
// UPDATE TICKET STATUS (auth required)
// ============================================================

export async function updateTicketStatusAction(
  ticketId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !["admin", "technician"].includes(session.role)) {
    return { success: false, error: "Sin permisos" };
  }

  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Estado inválido" };
  }

  try {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: status as never },
    });

    // Notify the ticket submitter if resolved/closed
    if (status === "resolved" || status === "closed") {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { employee_email: true, subject: true, employee_name: true },
      });
    }

    revalidatePath("/dashboard/tickets");
    return { success: true };
  } catch (err) {
    console.error("updateTicketStatusAction error:", err);
    return { success: false, error: "Error al actualizar el estado" };
  }
}

// ============================================================
// ASSIGN TICKET (auth required)
// ============================================================

export async function assignTicketAction(
  ticketId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || !["admin", "technician"].includes(session.role)) {
    return { success: false, error: "Sin permisos" };
  }

  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assigned_to: userId, status: "in_progress" },
    });

    // Notify the assigned user
    if (userId !== session.id) {
      await prisma.notification.create({
        data: {
          user_id: userId,
          type: "ticket_assigned",
          title: "Ticket asignado",
          message: `Te asignaron: ${ticket.subject}`,
          link: `/dashboard/tickets/${ticket.id}`,
        },
      });
    }

    revalidatePath("/dashboard/tickets");
    return { success: true };
  } catch (err) {
    console.error("assignTicketAction error:", err);
    return { success: false, error: "Error al asignar el ticket" };
  }
}

// ============================================================
// DELETE TICKET (admin only) — physical delete
// ============================================================

export async function deleteTicketAction(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Solo administradores pueden eliminar tickets" };
  }

  try {
    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    revalidatePath("/dashboard/tickets");
    return { success: true };
  } catch (err) {
    console.error("deleteTicketAction error:", err);
    return { success: false, error: "Error al eliminar el ticket" };
  }
}
