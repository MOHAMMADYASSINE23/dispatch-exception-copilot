import { Category, PrismaClient, Severity, ShipmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

const ACTOR = "Dispatcher_System";

interface SeedException {
  severity: Severity;
  category: Category;
  resolved: boolean;
  rawInput: "Example: a synthetic delivery exception for demonstration.",
  actionPlan: string;
  notificationText: string;
}

interface SeedShipment {
  trackingNumber: string;
  customerName: string;
  destinationCity: string;
  status: ShipmentStatus;
  exceptions?: SeedException[];
}

// Lean sample set that still covers all dashboard/state-machine use-cases.
const SHIPMENTS: SeedShipment[] = [
  {
    trackingNumber: "DEMO-240001",
    customerName: "Demo Customer A",
    destinationCity: "Sample District 1",
    status: ShipmentStatus.DISPATCHED,
  },
  {
    trackingNumber: "DEMO-240002",
    customerName: "Demo Customer B",
    destinationCity: "Sample District 2",
    status: ShipmentStatus.IN_TRANSIT,
  },
  {
    trackingNumber: "DEMO-240003",
    customerName: "Demo Customer C",
    destinationCity: "Sample District 3",
    status: ShipmentStatus.HALTED,
    exceptions: [
      {
        severity: Severity.HIGH,
        category: Category.VEHICLE_ISSUE,
        resolved: false,
        rawInput: "Example: a synthetic delivery exception for demonstration.",
        actionPlan:
          "**Recommended Action Plan — Vehicle Issue (HIGH)**\n\n1. Dispatch the nearest backup vehicle to recover the parcels on board.\n2. Move the driver's remaining stops to the relief route.\n3. Log the vehicle fault with the fleet team for inspection.\n\n**ETA impact:** +2–4 hrs (same-day at risk)",
        notificationText:
          "Hi! There's a short delay with your delivery due to a vehicle issue on our side. A backup courier is taking over and we'll update you with a new ETA shortly. Thank you for your patience.",
      },
    ],
  },
  {
    trackingNumber: "DEMO-240004",
    customerName: "Demo Customer D",
    destinationCity: "Sample District 4",
    status: ShipmentStatus.HALTED,
    exceptions: [
      {
        severity: Severity.CRITICAL,
        category: Category.WEATHER,
        resolved: false,
        rawInput: "Example: a synthetic delivery exception for demonstration.",
        actionPlan:
          "**Recommended Action Plan — Weather Disruption (CRITICAL)**\n\n1. Pause the affected route until the road/weather advisory clears.\n2. Re-sequence safe stops and shift exposed stops to the next slot.\n3. Notify impacted customers proactively about the delay.\n\n**ETA impact:** Next-day reschedule likely",
        notificationText:
          "[Priority] Hi! Severe weather is affecting deliveries in your area, so your parcel may arrive later than planned. We're prioritising safety and will keep you posted. Thanks for understanding.",
      },
    ],
  },
  {
    trackingNumber: "DEMO-240005",
    customerName: "Demo Customer E",
    destinationCity: "Sample District 5",
    status: ShipmentStatus.IN_TRANSIT,
    exceptions: [
      {
        severity: Severity.LOW,
        category: Category.CUSTOMER_ABSENT,
        resolved: true,
        rawInput: "Example: a synthetic delivery exception for demonstration.",
        actionPlan:
          "**Recommended Action Plan — Customer Absent (LOW)**\n\n1. Attempt a call-back to the customer on the registered number.\n2. Send the rescheduling SMS with a self-service delivery window link.\n3. Hold the parcel at the local hub for one (1) retry before return.\n\n**ETA impact:** +30–60 min (minor delay)",
        notificationText:
          "Hi! We tried to deliver your parcel but couldn't reach you. Reply with a convenient time and we'll redeliver. We'll hold it safely at your local hub in the meantime.",
      },
    ],
  },
  {
    trackingNumber: "DEMO-240006",
    customerName: "Demo Customer F",
    destinationCity: "Sample District 6",
    status: ShipmentStatus.DELIVERED,
  },
];

async function main() {
  const existingShipments = await prisma.shipment.count();
  if (existingShipments > 0) {
    console.log(`Found ${existingShipments} existing shipments; leaving production data unchanged.`);
    return;
  }

  console.log("Database is empty; inserting sample dispatch data…");

  console.log(`Seeding ${SHIPMENTS.length} shipments…`);

  let exceptionCount = 0;

  for (const seed of SHIPMENTS) {
    const { exceptions, ...shipmentData } = seed;

    const shipment = await prisma.shipment.create({
      data: shipmentData,
    });

    // Audit the initial shipment creation so the activity feed is populated.
    await prisma.auditLog.create({
      data: {
        entityType: "SHIPMENT",
        entityId: shipment.id,
        action: "SHIPMENT_CREATED",
        oldState: null,
        newState: shipment.status,
        changedBy: ACTOR,
      },
    });

    for (const exceptionSeed of exceptions ?? []) {
      const exception = await prisma.exception.create({
        data: {
          shipmentId: shipment.id,
          severity: exceptionSeed.severity,
          category: exceptionSeed.category,
          resolved: exceptionSeed.resolved,
          rawInput: "Example: a synthetic delivery exception for demonstration.",
          actionPlan: exceptionSeed.actionPlan,
          notificationText: exceptionSeed.notificationText,
        },
      });
      exceptionCount += 1;

      await prisma.auditLog.create({
        data: {
          exceptionId: exception.id,
          entityType: "EXCEPTION",
          entityId: exception.id,
          action: "EXCEPTION_CREATED",
          oldState: null,
          newState: `${exception.resolved ? "resolved" : "unresolved"} (${exception.severity}/${exception.category})`,
          changedBy: ACTOR,
        },
      });
    }
  }

  console.log(
    `Done. Seeded ${SHIPMENTS.length} shipments and ${exceptionCount} exceptions.`,
  );
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
