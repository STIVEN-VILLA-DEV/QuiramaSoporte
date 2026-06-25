import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  publicTicketSchema,
  deviceSchema,
  maintenanceSchema,
  sanitizeString,
  getFirstError,
} from "@/lib/validation";
import type { z } from "zod";

// ============================================================
// HELPERS
// ============================================================

function expectValid<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  expect(result.success).toBe(true);
  return result.data as T;
}

function expectInvalid<T>(schema: z.ZodSchema<T>, input: unknown): string {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  if (!result.success) {
    return getFirstError(result.error);
  }
  return "";
}

// ============================================================
// SANITIZE STRING
// ============================================================

describe("sanitizeString", () => {
  it("escapes basic HTML entities", () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("handles plain text unchanged", () => {
    expect(sanitizeString("Hello world")).toBe("Hello world");
  });

  it("escapes single quotes", () => {
    expect(sanitizeString("it's a test")).toBe("it&#x27;s a test");
  });

  it("handles empty string", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("escapes ampersands first", () => {
    expect(sanitizeString("AT&T")).toBe("AT&amp;T");
  });
});

// ============================================================
// LOGIN SCHEMA
// ============================================================

describe("loginSchema", () => {
  it("validates a correct login", () => {
    const data = expectValid(loginSchema, {
      email: "test@example.com",
      password: "password123",
    });
    expect(data.email).toBe("test@example.com");
  });

  it("lowercases and trims email", () => {
    const data = expectValid(loginSchema, {
      email: "  Test@Example.COM  ",
      password: "password123",
    });
    expect(data.email).toBe("test@example.com");
  });

  it("rejects invalid email", () => {
    const error = expectInvalid(loginSchema, {
      email: "not-an-email",
      password: "password123",
    });
    expect(error).toContain("Email");
  });

  it("rejects short password", () => {
    const error = expectInvalid(loginSchema, {
      email: "test@example.com",
      password: "123",
    });
    expect(error).toContain("8 caracteres");
  });

  it("rejects too long email", () => {
    const error = expectInvalid(loginSchema, {
      email: "a".repeat(256) + "@example.com",
      password: "password123",
    });
    expect(error).toBeTruthy();
  });
});

// ============================================================
// REGISTER SCHEMA
// ============================================================

describe("registerSchema", () => {
  const validRegister = {
    email: "user@example.com",
    password: "SecurePass1",
    name: "Test User",
    role: "viewer" as const,
  };

  it("validates correct registration", () => {
    const data = expectValid(registerSchema, validRegister);
    expect(data.name).toBe("Test User");
  });

  it("requires uppercase letter in password", () => {
    const error = expectInvalid(registerSchema, {
      ...validRegister,
      password: "securepass1",
    });
    expect(error).toContain("mayúscula");
  });

  it("requires number in password", () => {
    const error = expectInvalid(registerSchema, {
      ...validRegister,
      password: "SecurePass",
    });
    expect(error).toContain("número");
  });

  it("rejects invalid role", () => {
    const error = expectInvalid(registerSchema, {
      ...validRegister,
      role: "superadmin",
    });
    expect(error).toBeTruthy();
  });

  it("accepts empty branch_id", () => {
    const data = expectValid(registerSchema, {
      ...validRegister,
      branch_id: "",
    });
    expect(data.branch_id).toBeUndefined();
  });
});

// ============================================================
// PUBLIC TICKET SCHEMA
// ============================================================

describe("publicTicketSchema", () => {
  const validTicket = {
    employee_name: "Juan Pérez",
    employee_email: "juan@example.com",
    branch_name: "CEDROS",
    department: "IT",
    category: "software",
    subject: "Problema con el sistema",
    description: "El sistema no abre cuando intento iniciar sesión desde mi computadora.",
  };

  it("validates a correct ticket", () => {
    const data = expectValid(publicTicketSchema, validTicket);
    expect(data.employee_name).toBe("Juan Pérez");
  });

  it("rejects missing required fields", () => {
    const error = expectInvalid(publicTicketSchema, {
      ...validTicket,
      employee_name: "",
    });
    expect(error).toContain("nombre");
  });

  it("rejects description shorter than 10 characters", () => {
    const error = expectInvalid(publicTicketSchema, {
      ...validTicket,
      description: "Corto",
    });
    expect(error).toContain("10 caracteres");
  });

  it("trims whitespace from name", () => {
    const data = expectValid(publicTicketSchema, {
      ...validTicket,
      employee_name: "  Juan Pérez  ",
    });
    expect(data.employee_name).toBe("Juan Pérez");
  });
});

// ============================================================
// DEVICE SCHEMA
// ============================================================

describe("deviceSchema", () => {
  const validDevice = {
    name: "PC-001",
    category: "computer" as const,
    brand: "Dell",
    model: "OptiPlex 7080",
    serial_number: "SN123456789",
    status: "active" as const,
    branch_id: "",
    location: "Oficina 201",
    department: "IT",
  };

  it("validates a correct device", () => {
    const data = expectValid(deviceSchema, validDevice);
    expect(data.category).toBe("computer");
  });

  it("rejects invalid category", () => {
    const error = expectInvalid(deviceSchema, {
      ...validDevice,
      category: "spaceship",
    });
    expect(error).toBeTruthy();
  });

  it("coerces boolean from string", () => {
    const data = expectValid(deviceSchema, {
      ...validDevice,
      malware_detected: "true",
    });
    expect(data.malware_detected).toBe(true);
  });

  it("allows optional specs", () => {
    const data = expectValid(deviceSchema, {
      ...validDevice,
      specs: { cpu: "i7", ram: 16 },
    });
    expect(data.specs?.cpu).toBe("i7");
  });
});

// ============================================================
// MAINTENANCE SCHEMA
// ============================================================

describe("maintenanceSchema", () => {
  const validMaintenance = {
    device_id: "abc-123",
    type: "preventive" as const,
    status: "scheduled" as const,
    priority: "medium" as const,
    title: "Mantenimiento trimestral",
    description: "Revisión general del equipo",
  };

  it("validates correct maintenance", () => {
    const data = expectValid(maintenanceSchema, validMaintenance);
    expect(data.priority).toBe("medium");
  });

  it("rejects empty title", () => {
    const error = expectInvalid(maintenanceSchema, {
      ...validMaintenance,
      title: "",
    });
    expect(error).toContain("Título");
  });

  it("rejects invalid priority", () => {
    const error = expectInvalid(maintenanceSchema, {
      ...validMaintenance,
      priority: "urgent",
    });
    expect(error).toBeTruthy();
  });
});
