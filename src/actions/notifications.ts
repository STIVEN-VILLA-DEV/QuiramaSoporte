"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function markNotificationReadAction(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autenticado" };

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        user_id: session.id, // Security: only own notifications
      },
      data: { read_at: new Date() },
    });

    return { success: true };
  } catch (err) {
    console.error("markNotificationReadAction error:", err);
    return { success: false, error: "Error al marcar notificación" };
  }
}

export async function markAllNotificationsReadAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autenticado" };

    await prisma.notification.updateMany({
      where: {
        user_id: session.id,
        read_at: null,
      },
      data: { read_at: new Date() },
    });

    return { success: true };
  } catch (err) {
    console.error("markAllNotificationsReadAction error:", err);
    return { success: false, error: "Error al marcar notificaciones" };
  }
}

// ============================================================
// DELETE NOTIFICATION (physical delete)
// ============================================================

export async function deleteNotificationAction(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autenticado" };

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        user_id: session.id, // Security: only own notifications
      },
    });

    return { success: true };
  } catch (err) {
    console.error("deleteNotificationAction error:", err);
    return { success: false, error: "Error al eliminar notificación" };
  }
}

// ============================================================
// DELETE ALL NOTIFICATIONS (physical delete)
// ============================================================

export async function clearAllNotificationsAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autenticado" };

    await prisma.notification.deleteMany({
      where: { user_id: session.id },
    });

    return { success: true };
  } catch (err) {
    console.error("clearAllNotificationsAction error:", err);
    return { success: false, error: "Error al limpiar notificaciones" };
  }
}
