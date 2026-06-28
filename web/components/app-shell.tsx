import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Atmosphere layers */}
      <div className="pointer-events-none fixed inset-0 z-0 grid-bg" />
      <div className="pointer-events-none fixed inset-0 z-0 canvas-atmos" />

      <div className="relative z-10 flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-5 py-6 lg:px-7 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
