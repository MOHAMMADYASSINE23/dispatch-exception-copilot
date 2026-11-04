import { describe, expect, it } from "vitest";

import { Severity, ShipmentStatus, type ShipmentDTO } from "@/lib/types";
import { sortShipments } from "@/lib/shipment-sort";

function makeShipment(
  id: string,
  options: {
    status?: ShipmentStatus;
    createdAt?: string;
    updatedAt?: string;
    exceptions?: ShipmentDTO["exceptions"];
  } = {},
): ShipmentDTO {
  return {
    id,
    trackingNumber: `DXC-${id}`,
    customerName: `Customer ${id}`,
    destinationCity: "Beirut",
    status: options.status ?? ShipmentStatus.IN_TRANSIT,
    createdAt: options.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: options.updatedAt ?? "2026-01-01T00:00:00.000Z",
    exceptions: options.exceptions ?? [],
  };
}

function makeException(
  shipmentId: string,
  severity: Severity,
  createdAt: string,
  resolved = false,
): ShipmentDTO["exceptions"][number] {
  return {
    id: `${shipmentId}-${severity}-${createdAt}`,
    shipmentId,
    severity,
    category: "VEHICLE_ISSUE",
    resolved,
    rawInput: "Courier reported an issue",
    actionPlan: "Contact the courier",
    notificationText: "Your delivery is delayed",
    createdAt,
    updatedAt: createdAt,
  };
}

describe("sortShipments", () => {
  it("puts the highest-severity unresolved exceptions first", () => {
    const shipments = [
      makeShipment("low", {
        exceptions: [makeException("low", Severity.LOW, "2026-01-01T00:00:00Z")],
      }),
      makeShipment("critical", {
        exceptions: [
          makeException("critical", Severity.CRITICAL, "2026-01-03T00:00:00Z"),
        ],
      }),
      makeShipment("high", {
        exceptions: [makeException("high", Severity.HIGH, "2026-01-02T00:00:00Z")],
      }),
    ];

    expect(sortShipments(shipments, "PRIORITY").map((shipment) => shipment.id)).toEqual(
      ["critical", "high", "low"],
    );
  });

  it("uses the oldest open exception as the tie-breaker and ignores resolved ones", () => {
    const newerOpen = makeShipment("newer", {
      exceptions: [
        makeException("newer", Severity.HIGH, "2026-01-04T00:00:00Z"),
        makeException("newer", Severity.CRITICAL, "2026-01-01T00:00:00Z", true),
      ],
    });
    const olderOpen = makeShipment("older", {
      exceptions: [
        makeException("older", Severity.HIGH, "2026-01-02T00:00:00Z"),
      ],
    });

    expect(sortShipments([newerOpen, olderOpen], "PRIORITY").map((s) => s.id)).toEqual(
      ["older", "newer"],
    );
  });

  it("supports oldest and newest shipment creation order without mutating input", () => {
    const shipments = [
      makeShipment("newest", { createdAt: "2026-01-03T00:00:00Z" }),
      makeShipment("oldest", { createdAt: "2026-01-01T00:00:00Z" }),
      makeShipment("middle", { createdAt: "2026-01-02T00:00:00Z" }),
    ];

    expect(sortShipments(shipments, "OLDEST").map((s) => s.id)).toEqual([
      "oldest",
      "middle",
      "newest",
    ]);
    expect(sortShipments(shipments, "NEWEST").map((s) => s.id)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
    expect(shipments.map((shipment) => shipment.id)).toEqual([
      "newest",
      "oldest",
      "middle",
    ]);
  });
});
