import { Severity, type ShipmentDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_RANK: Record<Severity, number> = {
  [Severity.CRITICAL]: 3,
  [Severity.HIGH]: 2,
  [Severity.LOW]: 1,
};

const SEVERITY_DOT_CLASS: Record<Severity, string> = {
  [Severity.CRITICAL]: "bg-destructive",
  [Severity.HIGH]: "bg-warning",
  [Severity.LOW]: "bg-primary-foreground/40",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  [Severity.CRITICAL]: "critical severity",
  [Severity.HIGH]: "high severity",
  [Severity.LOW]: "low severity",
};

function worstOpenSeverity(shipment: ShipmentDTO): Severity | null {
  const open = shipment.exceptions.filter((exception) => !exception.resolved);
  if (open.length === 0) return null;
  return open.reduce<Severity>(
    (worst, exception) =>
      SEVERITY_RANK[exception.severity] > SEVERITY_RANK[worst]
        ? exception.severity
        : worst,
    open[0].severity,
  );
}

export function ActiveShipmentList({
  shipments,
  selectedShipmentId,
  onSelect,
}: {
  shipments: ShipmentDTO[];
  selectedShipmentId: string | null;
  onSelect: (shipmentId: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-foreground/50">
        Active shipments
      </p>
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto xl:max-h-[calc(100vh-16rem)]">
        {shipments.length === 0 && (
          <p className="rounded-md border border-primary-foreground/10 bg-primary-foreground/5 px-2.5 py-3 text-center text-xs text-primary-foreground/50">
            No eligible shipments.
          </p>
        )}
        {shipments.map((shipment) => {
          const severity = worstOpenSeverity(shipment);
          const selected = shipment.id === selectedShipmentId;
          return (
            <button
              key={shipment.id}
              type="button"
              onClick={() => onSelect(shipment.id)}
              aria-current={selected}
              className={cn(
                "w-full rounded-md border px-2.5 py-2 text-left transition-colors",
                selected
                  ? "border-accent/50 bg-accent/10"
                  : "border-primary-foreground/10 bg-primary-foreground/5 hover:border-primary-foreground/20 hover:bg-primary-foreground/10",
              )}
            >
              <div className="text-xs font-semibold text-primary-foreground">
                {shipment.trackingNumber}
                <span className="font-normal text-primary-foreground/50">
                  {" "}
                  · {shipment.destinationCity}
                </span>
              </div>
              {severity && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-primary-foreground/60">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      SEVERITY_DOT_CLASS[severity],
                    )}
                  />
                  {SEVERITY_LABEL[severity]}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
