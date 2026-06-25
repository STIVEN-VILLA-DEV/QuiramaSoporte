import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Verify the database connection and that tables exist
    await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({ success: true, message: "Conexión a base de datos verificada" });
  } catch (error) {
    console.error("DB connection error:", error);
    return NextResponse.json(
      { success: false, error: "Error de conexión a la base de datos. Ejecutá 'pnpm db:push' primero." },
      { status: 500 }
    );
  }
}
