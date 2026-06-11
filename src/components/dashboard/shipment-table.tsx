"use client";

import { Fragment, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronRight,
  PackageCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import {
  CategoryBadge,
  ExceptionStatusBadge,
  SeverityBadge,
  ShipmentStatusBadge,
} from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  markShipmentDelivered,
  markShipmentInTransit,
} from "@/app/actions/shipments";
import { updateExceptionStatus } from "@/app/actions/exceptions";
import {
  ExceptionStatus,
  ShipmentStatus,
  type ShipmentDTO,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function openExceptionCount(shipment: ShipmentDTO): number {
  return shipment.exceptions.filter(
    (exception) =>
      exception.status === ExceptionStatus.TRIAGE ||
      exception.status === ExceptionStatus.ACTIONING,
  ).length;
}

export function ShipmentTable({
  shipments,
  onMutated,
}: {
  shipments: ShipmentDTO[];
  onMutated: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleDeliver(shipment: ShipmentDTO) {
    startTransition(async () => {
      const result = await markShipmentDelivered(shipment.id);
      if (!result.ok) {
        toast.error("Delivery blocked (Rule A)", { description: result.error });
        return;
      }
      toast.success(`${shipment.trackingNumber} delivered`, {
        description: "Status change recorded in the audit log.",
      });
      onMutated();
    });
  }

  function handleInTransit(shipment: ShipmentDTO) {
    startTransition(async () => {
      const result = await markShipmentInTransit(shipment.id);
      if (!result.ok) {
        toast.error("Could not update", { description: result.error });
        return;
      }
      toast.success(`${shipment.trackingNumber} is in transit`);
      onMutated();
    });
  }

  function handleResolve(exceptionId: string, next: ExceptionStatus) {
    startTransition(async () => {
      const result = await updateExceptionStatus(exceptionId, next);
      if (!result.ok) {
        toast.error("Could not update exception", {
          description: result.error,
        });
        return;
      }
      toast.success(`Exception moved to ${next}`, {
        description:
          next === ExceptionStatus.RESOLVED
            ? "Shipment auto-released if no open exceptions remain."
            : "Audit log updated.",
      });
      onMutated();
    });
  }

  if (shipments.length === 0) {
    return (
      <div className="ops-panel flex h-40 items-center justify-center rounded-xl border-dashed text-sm text-muted-foreground">
        No shipments yet. Seed the database to get started.
      </div>
    );
  }

  return (
    <section className="ops-panel rounded-xl p-3 md:p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Shipment queue
          </p>
          <h2 className="font-display text-xl font-semibold tracking-[-0.03em]">
            Active Shipments
          </h2>
        </div>
        <span className="rounded-full border border-primary/10 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
          {shipments.length} records
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-primary/10 bg-background/55">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5 hover:bg-primary/5">
              <TableHead className="w-8" />
              <TableHead>Tracking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {shipments.map((shipment) => {
            const openCount = openExceptionCount(shipment);
            const isExpanded = expanded[shipment.id];
            const hasExceptions = shipment.exceptions.length > 0;

            return (
              <Fragment key={shipment.id}>
                <TableRow
                  className={cn(
                    "ledger-row",
                    shipment.status === ShipmentStatus.HALTED &&
                      "bg-destructive/10 hover:bg-destructive/15",
                  )}
                >
                  <TableCell className="pr-0">
                    {hasExceptions ? (
                      <button
                        type="button"
                        onClick={() => toggle(shipment.id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-display text-xs font-semibold tracking-[0.02em]">
                    {shipment.trackingNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{shipment.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {shipment.customerPhone}
                    </div>
                  </TableCell>
                  <TableCell>{shipment.destinationCity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ShipmentStatusBadge status={shipment.status} />
                      {openCount > 0 && (
                        <span className="rounded-full border border-destructive/15 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-destructive">
                          {openCount} open
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {shipment.status === ShipmentStatus.DISPATCHED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInTransit(shipment)}
                          disabled={isPending}
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Transit
                        </Button>
                      )}
                      {shipment.status !== ShipmentStatus.DELIVERED && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleDeliver(shipment)}
                          disabled={isPending}
                        >
                          <PackageCheck className="h-3.5 w-3.5" />
                          Deliver
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded &&
                  shipment.exceptions.map((exception) => (
                    <TableRow
                      key={exception.id}
                      className="bg-secondary/50 hover:bg-secondary/70"
                    >
                      <TableCell />
                      <TableCell colSpan={5} className="py-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <SeverityBadge severity={exception.severity} />
                            <CategoryBadge category={exception.category} />
                            <ExceptionStatusBadge status={exception.status} />
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                exception.createdAt,
                              ).toLocaleString()}
                            </span>
                          </div>
                          <p className="max-w-3xl text-xs italic leading-relaxed text-muted-foreground">
                            &ldquo;{exception.rawInput}&rdquo;
                          </p>
                          <div className="flex gap-1.5">
                            {exception.status === ExceptionStatus.TRIAGE && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleResolve(
                                    exception.id,
                                    ExceptionStatus.ACTIONING,
                                  )
                                }
                                disabled={isPending}
                              >
                                Start actioning
                              </Button>
                            )}
                            {exception.status !==
                              ExceptionStatus.RESOLVED && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  handleResolve(
                                    exception.id,
                                    ExceptionStatus.RESOLVED,
                                  )
                                }
                                disabled={isPending}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </Fragment>
            );
          })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
