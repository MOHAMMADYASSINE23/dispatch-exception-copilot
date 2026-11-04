import { Severity, ShipmentStatus, type ShipmentDTO } from "@/lib/types";

export type ShipmentSortMode = "PRIORITY" | "RECENT" | "OLDEST" | "NEWEST";

const SEVERITY_RANK: Record<Severity, number> = {
  [Severity.LOW]: 1,
  [Severity.HIGH]: 2,
  [Severity.CRITICAL]: 3,
};

const STATUS_RANK: Record<ShipmentStatus, number> = {
  [ShipmentStatus.DELIVERED]: 0,
  [ShipmentStatus.DISPATCHED]: 1,
  [ShipmentStatus.IN_TRANSIT]: 2,
  [ShipmentStatus.HALTED]: 3,
};

function oldestOpenExceptionAt(shipment: ShipmentDTO): number {
  return shipment.exceptions
    .filter((exception) => !exception.resolved)
    .reduce(
      (oldest, exception) =>
        Math.min(oldest, Date.parse(exception.createdAt)),
      Number.POSITIVE_INFINITY,
    );
}

function highestOpenSeverityRank(shipment: ShipmentDTO): number {
  return shipment.exceptions.reduce(
    (highest, exception) =>
      exception.resolved
        ? highest
        : Math.max(highest, SEVERITY_RANK[exception.severity]),
    0,
  );
}

function comparePriority(left: ShipmentDTO, right: ShipmentDTO): number {
  const severityDifference =
    highestOpenSeverityRank(right) - highestOpenSeverityRank(left);
  if (severityDifference !== 0) return severityDifference;

  const leftOpenCount = left.exceptions.filter((exception) => !exception.resolved).length;
  const rightOpenCount = right.exceptions.filter((exception) => !exception.resolved).length;
  if (leftOpenCount !== rightOpenCount) return rightOpenCount - leftOpenCount;

  const ageDifference = oldestOpenExceptionAt(left) - oldestOpenExceptionAt(right);
  if (Number.isFinite(ageDifference) && ageDifference !== 0) return ageDifference;

  const statusDifference = STATUS_RANK[right.status] - STATUS_RANK[left.status];
  if (statusDifference !== 0) return statusDifference;

  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

export function sortShipments(
  shipments: ShipmentDTO[],
  mode: ShipmentSortMode,
): ShipmentDTO[] {
  return [...shipments].sort((left, right) => {
    if (mode === "PRIORITY") return comparePriority(left, right);
    if (mode === "OLDEST") {
      return Date.parse(left.createdAt) - Date.parse(right.createdAt);
    }
    if (mode === "NEWEST") {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    }
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
}
