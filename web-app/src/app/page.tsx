import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getRecentAuditLogs, getShipments } from "@/app/actions/shipments";

// Always render fresh data on request — this dashboard is inherently dynamic.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [shipments, logs] = await Promise.all([
    getShipments(),
    getRecentAuditLogs(),
  ]);

  // Reflect whether the real AI service is wired (vs the built-in mock). This
  // is read on the server; the seam in `mock-ai.ts` switches on the same env.
  const aiLive = Boolean(process.env.AI_SERVICE_URL);

  return (
    <main className="ops-shell min-h-screen">
      <div className="mx-auto max-w-[1440px] px-5 py-6 lg:px-7 lg:py-8">
        <DashboardClient
          initialShipments={shipments}
          initialLogs={logs}
          aiLive={aiLive}
        />
      </div>
    </main>
  );
}
