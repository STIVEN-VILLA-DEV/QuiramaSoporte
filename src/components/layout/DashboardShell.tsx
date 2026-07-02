"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ShortcutsModal from "./ShortcutsModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { UserSession } from "@/types";

interface Props {
  session: UserSession;
  children: React.ReactNode;
}

export default function DashboardShell({ session, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => {
    const handler = () => setShortcutsOpen((v) => !v);
    window.addEventListener("toggle-shortcuts", handler);
    return () => window.removeEventListener("toggle-shortcuts", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        session={session}
        mobileOpen={mobileOpen}
        onToggle={() => setMobileOpen((v) => !v)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar session={session} onToggle={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
