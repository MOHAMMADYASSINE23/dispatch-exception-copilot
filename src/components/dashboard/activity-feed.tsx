import {
  ArrowRight,
  Clock3,
  FilePlus2,
  OctagonPause,
  PackageCheck,
  RotateCcw,
  Truck,
} from "lucide-react";

import type { AuditLogDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

function iconFor(action: string) {
  switch (action) {
    case "AUTO_HALT":
      return OctagonPause;
    case "AUTO_RELEASE":
      return RotateCcw;
    case "EXCEPTION_CREATED":
      return FilePlus2;
    default:
      break;
  }
  return action.includes("DELIVERED") ? PackageCheck : Truck;
}

function toneFor(action: string): string {
  switch (action) {
    case "AUTO_HALT":
      return "text-destructive bg-destructive/10";
    case "AUTO_RELEASE":
      return "text-warning bg-warning/10";
    case "EXCEPTION_CREATED":
      return "text-primary bg-primary/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function labelFor(log: AuditLogDTO): string {
  const map: Record<string, string> = {
    AUTO_HALT: "Shipment auto-halted",
    AUTO_RELEASE: "Shipment released",
    EXCEPTION_CREATED: "Exception logged",
    STATUS_CHANGE:
      log.entityType === "SHIPMENT" ? "Shipment status change" : "Exception status change",
  };
  return map[log.action] ?? log.action;
}

export function ActivityFeed({ logs }: { logs: AuditLogDTO[] }) {
  return (
    <section className="ops-panel rounded-xl p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Append-only trace
          </p>
          <h2 className="font-display text-xl font-semibold tracking-[-0.03em]">
            Audit Activity
          </h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/10 bg-secondary text-primary">
          <Clock3 className="h-4 w-4" />
        </span>
      </div>

        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </div>
        ) : (
          <ol className="space-y-3">
            {logs.map((log) => {
              const Icon = iconFor(log.action);
              return (
                <li
                  key={log.id}
                  className="ledger-row flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:border-primary/10 hover:bg-background/45"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                      toneFor(log.action),
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {labelFor(log)}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {log.entityType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {log.oldState && (
                        <>
                          <span className="font-mono">{log.oldState}</span>
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                      <span className="font-mono">{log.newState}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground/70">
                      {log.changedBy} ·{" "}
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
    </section>
  );
}
