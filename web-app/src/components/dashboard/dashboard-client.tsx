"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Boxes,
  Check,
  CircleDot,
  FileWarning,
  OctagonPause,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { NewShipmentDialog } from "@/components/dashboard/new-shipment-dialog";
import { ShipmentTable } from "@/components/dashboard/shipment-table";
import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { getRecentAuditLogs, getShipments } from "@/app/actions/shipments";
import {
  ShipmentStatus,
  type AuditLogDTO,
  type ShipmentDTO,
} from "@/lib/types";
import { useDispatchStore } from "@/store/use-dispatch-store";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 5000;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  tone: string;
}) {
  return (
    <div className={cn("metric-tile rounded-lg p-4 text-foreground", tone)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-3xl font-semibold leading-none tracking-[-0.03em]">
            {value}
          </div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-background/70">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export function DashboardClient({
  initialShipments,
  initialLogs,
  aiLive,
}: {
  initialShipments: ShipmentDTO[];
  initialLogs: AuditLogDTO[];
  aiLive: boolean;
}) {
  const shipments = useDispatchStore((state) => state.shipments);
  const setShipments = useDispatchStore((state) => state.setShipments);
  const [logs, setLogs] = useState<AuditLogDTO[]>(initialLogs);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  // Hydrate the store from the server-rendered snapshot once on mount.
  useEffect(() => {
    setShipments(initialShipments);
    setHydrated(true);
  }, [initialShipments, setShipments]);

  const refresh = useCallback(async () => {
    try {
      const [nextShipments, nextLogs] = await Promise.all([
        getShipments(),
        getRecentAuditLogs(),
      ]);
      setShipments(nextShipments);
      setLogs(nextLogs);
      setLastSynced(new Date());
      setSyncError(false);
    } catch (error) {
      setSyncError(true);
      throw error;
    }
  }, [setShipments]);

  // Poll for fresh data on an interval (the dashboard's "real-time" feel).
  useEffect(() => {
    const id = setInterval(() => {
      void refresh().catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success("Dashboard is up to date.");
    } catch {
      toast.error("Could not refresh the dashboard. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // After creating a shipment, refresh the ledger and briefly highlight the row.
  const handleShipmentCreated = useCallback(
    async (shipmentId: string) => {
      await refresh();
      setHighlightId(shipmentId);
      setTimeout(() => setHighlightId(null), 2200);
    },
    [refresh],
  );

  // Use the server snapshot until the store has hydrated to avoid a flash.
  const displayShipments = hydrated ? shipments : initialShipments;

  const halted = displayShipments.filter(
    (shipment) => shipment.status === ShipmentStatus.HALTED,
  ).length;
  const inTransit = displayShipments.filter(
    (shipment) => shipment.status === ShipmentStatus.IN_TRANSIT,
  ).length;
  const delivered = displayShipments.filter(
    (shipment) => shipment.status === ShipmentStatus.DELIVERED,
  ).length;

  const openExceptions = displayShipments.reduce(
    (total, shipment) =>
      total + shipment.exceptions.filter((exception) => !exception.resolved).length,
    0,
  );

  return (
    <>
    <header className="ops-header sticky top-0 z-30 -mx-5 mb-6 border-b border-primary/10 lg:-mx-7">
      <div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_12px_28px_hsl(var(--primary)_/_0.18)]">
            <Boxes className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Exception desk</p>
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-3xl">Dispatch Exception CoPilot</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <button type="button" onClick={handleRefresh} disabled={isRefreshing} aria-label="Refresh live operations" className="flex items-center gap-2 rounded-full border border-primary/15 bg-background px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5 disabled:opacity-70">
            {isRefreshing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : syncError ? <CircleDot className="h-3.5 w-3.5 text-destructive" /> : <CircleDot className="h-3.5 w-3.5 text-success" />}
            {isRefreshing ? "Refreshing…" : syncError ? "Sync issue · Retry" : "Live operations · Refresh"}
          </button>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-primary/15 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm [&::-webkit-details-marker]:hidden">
              <ShieldCheck className="h-3.5 w-3.5" /> Rules A/B/C active
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-lg border border-primary/15 bg-background p-4 text-sm text-foreground shadow-xl">
              <p className="mb-3 font-semibold">Automatic safeguards</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span><b className="text-foreground">A:</b> Shipments with open exceptions cannot be marked delivered.</span></li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span><b className="text-foreground">B:</b> High or critical exceptions halt the shipment.</span></li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span><b className="text-foreground">C:</b> Changes are recorded; resolving the last exception releases a halted shipment.</span></li>
              </ul>
            </div>
          </details>
        </div>
      </div>
      <div className="state-rail h-1 w-full" />
    </header>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.58fr)_minmax(390px,0.92fr)]">
      {/* Left column — dashboard */}
      <section className="space-y-5 motion-safe:animate-panel-in">
        <div className="control-panel rounded-xl p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Live state ledger
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">
                Shipments under control
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-success" />
                {lastSynced
                  ? `Synced ${lastSynced.toLocaleTimeString()}`
                  : "Polling every 5s"}
              </span>
              <NewShipmentDialog onCreated={handleShipmentCreated} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Halted"
              value={halted}
              icon={OctagonPause}
              tone="text-destructive"
            />
            <StatCard
              label="Open exceptions"
              value={openExceptions}
              icon={FileWarning}
              tone="text-warning"
            />
            <StatCard
              label="In transit"
              value={inTransit}
              icon={Truck}
              tone="text-primary"
            />
            <StatCard
              label="Delivered"
              value={delivered}
              icon={PackageCheck}
              tone="text-success"
            />
          </div>
        </div>

        <ShipmentTable
          shipments={displayShipments}
          onMutated={refresh}
          highlightId={highlightId}
        />

        <ActivityFeed logs={logs} />
      </section>

      {/* Right column — CoPilot */}
      <aside className="xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)] xl:min-h-0">
        <CopilotPanel onExecuted={refresh} aiLive={aiLive} />
      </aside>
    </div>
    </>
  );
}
