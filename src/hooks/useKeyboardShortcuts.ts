"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts hook.
 * Only fires when not focused on an input/textarea/select.
 *
 * Special: `?` dispatches a CustomEvent("toggle-shortcuts") on window.
 */
export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const isFormField = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (el as HTMLElement)?.contentEditable === "true"
      );
    };

    const handler = (e: KeyboardEvent) => {
      if (isFormField(e.target as Element)) return;
      if (e.metaKey || e.altKey) return;

      // Ctrl+K or / → search
      if ((e.ctrlKey && e.key.toLowerCase() === "k") || e.key === "/") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>(
          'input[type="text"][placeholder*="Buscar"]',
        );
        if (search) {
          search.focus();
          search.select();
        }
        return;
      }

      if (e.ctrlKey) return;

      switch (e.key) {
        case "N":
          e.preventDefault();
          router.push("/dashboard/devices/new");
          break;
        case "T":
          e.preventDefault();
          router.push("/dashboard/tickets");
          break;
        case "M":
          e.preventDefault();
          router.push("/dashboard/maintenance");
          break;
        case "D":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "?":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("toggle-shortcuts"));
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
