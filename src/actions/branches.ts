"use server";

import { prisma, serialize } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/db";
import type { Branch, ApiResponse } from "@/types";

// ============================================================
// GET ALL BRANCHES
// ============================================================

export async function getBranchesAction(): Promise<Branch[]> {
  try {
    const session = await getSession();
    if (!session) return [];

    const branches = await prisma.branch.findMany({
      orderBy: { slug: "asc" },
    });

    return serialize(branches) as unknown as Branch[];
  } catch (err) {
    console.error("Error loading branches:", err);
    return []; // Silently return empty — caller handles
  }
}

// ============================================================
// SEED BRANCHES (one-time setup)
// ============================================================

export async function seedBranchesAction(): Promise<ApiResponse> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);

  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    return { success: false, error: "Demasiadas solicitudes" };
  }

  try {
    // Upsert each branch — insert if missing, skip if exists
    const branches = [
      { name: "CEDROS" as const, slug: "cedros" },
      { name: "CRISTALES" as const, slug: "cristales" },
      { name: "CDA" as const, slug: "cda" },
      { name: "QUIRAMA" as const, slug: "quirama" },
    ];

    let created = 0;
    for (const b of branches) {
      const existing = await prisma.branch.findUnique({ where: { name: b.name } });
      if (!existing) {
        await prisma.branch.create({ data: b });
        created++;
      }
    }

    const allBranches = await prisma.branch.findMany({ orderBy: { slug: "asc" } });

    await logAudit(session.id, "SEED_BRANCHES", "branch", undefined, { created, total: allBranches.length }, ip);
    return {
      success: true,
      message: `Sedes actualizadas: ${allBranches.map((b) => b.name).join(", ")}${created > 0 ? ` (${created} nueva${created > 1 ? "s" : ""})` : " — ya estaban todas"}`,
    };
  } catch (err) {
    console.error("Seed branches error:", err);
    return { success: false, error: "Error al crear sedes" };
  }
}
