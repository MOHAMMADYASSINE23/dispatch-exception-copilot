import {
  Category,
  ExceptionStatus,
  PrismaClient,
  Severity,
  ShipmentStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const ACTOR = "Dispatcher_System";

interface SeedException {
  severity: Severity;
  category: Category;
  status: ExceptionStatus;
  rawInput: string;
  actionPlan: string;
  notificationText: string;
}

interface SeedShipment {
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  destinationCity: string;
  status: ShipmentStatus;
  exceptions?: SeedException[];
}

// 15+ shipments with realistic Lebanese data: destinations, names, +961 phones.
const SHIPMENTS: SeedShipment[] = [
  {
    trackingNumber: "LB-240001",
    customerName: "Ahmad Khalil",
    customerPhone: "+961 71 234 567",
    destinationCity: "Beirut",
    status: ShipmentStatus.IN_TRANSIT,
  },
  {
    trackingNumber: "LB-240002",
    customerName: "Elie Saad",
    customerPhone: "+961 70 884 221",
    destinationCity: "Jounieh",
    status: ShipmentStatus.DISPATCHED,
  },
  {
    trackingNumber: "LB-240003",
    customerName: "Rami Haddad",
    customerPhone: "+961 76 551 909",
    destinationCity: "Zahle",
    status: ShipmentStatus.HALTED,
    exceptions: [
      {
        severity: Severity.HIGH,
        category: Category.VEHICLE_ISSUE,
        status: ExceptionStatus.ACTIONING,
        rawInput:
          "el van 3etlit 3a tari2 Zahle, battery mfassakha w ma fini kammel",
        actionPlan:
          "**Recommended Action Plan — Vehicle Issue (HIGH)**\n\n1. Dispatch the nearest backup vehicle to recover the parcels on board.\n2. Move the driver's remaining stops to the relief route.\n3. Log the vehicle fault with the fleet team for inspection.\n\n**ETA impact:** +2–4 hrs (same-day at risk)",
        notificationText:
          "Hi! There's a short delay with your delivery due to a vehicle issue on our side. A backup courier is taking over and we'll update you with a new ETA shortly. Thank you for your patience.",
      },
    ],
  },
  {
    trackingNumber: "LB-240004",
    customerName: "Nour Mansour",
    customerPhone: "+961 03 778 145",
    destinationCity: "Tripoli",
    status: ShipmentStatus.HALTED,
    exceptions: [
      {
        severity: Severity.CRITICAL,
        category: Category.WEATHER,
        status: ExceptionStatus.TRIAGE,
        rawInput:
          "fi 3asfe w shté ktir 3a Tripoli, el tari2 ma2tou3 w khatar 3al driver",
        actionPlan:
          "**Recommended Action Plan — Weather Disruption (CRITICAL)**\n\n1. Pause the affected route until the road/weather advisory clears.\n2. Re-sequence safe stops and shift exposed stops to the next slot.\n3. Notify impacted customers proactively about the delay.\n\n**ETA impact:** Next-day reschedule likely",
        notificationText:
          "[Priority] Hi! Severe weather is affecting deliveries in your area, so your parcel may arrive later than planned. We're prioritising safety and will keep you posted. Thanks for understanding.",
      },
    ],
  },
  {
    trackingNumber: "LB-240005",
    customerName: "Maya Aoun",
    customerPhone: "+961 71 902 334",
    destinationCity: "Saida",
    status: ShipmentStatus.DELIVERED,
  },
  {
    trackingNumber: "LB-240006",
    customerName: "Hassan Fakih",
    customerPhone: "+961 76 120 778",
    destinationCity: "Tyre",
    status: ShipmentStatus.IN_TRANSIT,
    exceptions: [
      {
        severity: Severity.LOW,
        category: Category.CUSTOMER_ABSENT,
        status: ExceptionStatus.RESOLVED,
        rawInput: "zboun ma kén mawjoud awwal marra, rje3na ba3den w sallamna",
        actionPlan:
          "**Recommended Action Plan — Customer Absent (LOW)**\n\n1. Attempt a call-back to the customer on the registered number.\n2. Send the rescheduling SMS with a self-service delivery window link.\n3. Hold the parcel at the local hub for one (1) retry before return.\n\n**ETA impact:** +30–60 min (minor delay)",
        notificationText:
          "Hi! We tried to deliver your parcel but couldn't reach you. Reply with a convenient time and we'll redeliver. We'll hold it safely at your local hub in the meantime.",
      },
    ],
  },
  {
    trackingNumber: "LB-240007",
    customerName: "Carla Gerges",
    customerPhone: "+961 70 445 612",
    destinationCity: "Byblos",
    status: ShipmentStatus.DISPATCHED,
  },
  {
    trackingNumber: "LB-240008",
    customerName: "Ziad Nakhle",
    customerPhone: "+961 03 221 904",
    destinationCity: "Baalbek",
    status: ShipmentStatus.IN_TRANSIT,
  },
  {
    trackingNumber: "LB-240009",
    customerName: "Layla Daher",
    customerPhone: "+961 71 668 023",
    destinationCity: "Batroun",
    status: ShipmentStatus.DELIVERED,
  },
  {
    trackingNumber: "LB-240010",
    customerName: "Georges Rizk",
    customerPhone: "+961 76 339 871",
    destinationCity: "Aley",
    status: ShipmentStatus.HALTED,
    exceptions: [
      {
        severity: Severity.HIGH,
        category: Category.CUSTOMER_ABSENT,
        status: ExceptionStatus.TRIAGE,
        rawInput:
          "el zboun mish mawjoud bel beit w ma byjaweb 3al telephone, address ghalat ba2a",
        actionPlan:
          "**Recommended Action Plan — Customer Absent (HIGH)**\n\n1. Attempt a call-back to the customer on the registered number.\n2. Send the rescheduling SMS with a self-service delivery window link.\n3. Hold the parcel at the local hub for one (1) retry before return.\n\n**ETA impact:** +2–4 hrs (same-day at risk)",
        notificationText:
          "Hi! We tried to deliver your parcel but couldn't reach you. Reply with a convenient time and we'll redeliver. We'll hold it safely at your local hub in the meantime.",
      },
    ],
  },
  {
    trackingNumber: "LB-240011",
    customerName: "Sara Ibrahim",
    customerPhone: "+961 71 504 188",
    destinationCity: "Nabatieh",
    status: ShipmentStatus.DISPATCHED,
  },
  {
    trackingNumber: "LB-240012",
    customerName: "Tony Abou Khalil",
    customerPhone: "+961 03 990 556",
    destinationCity: "Zgharta",
    status: ShipmentStatus.IN_TRANSIT,
  },
  {
    trackingNumber: "LB-240013",
    customerName: "Rana Sleiman",
    customerPhone: "+961 76 712 340",
    destinationCity: "Bcharre",
    status: ShipmentStatus.DISPATCHED,
  },
  {
    trackingNumber: "LB-240014",
    customerName: "Karim Younes",
    customerPhone: "+961 70 318 627",
    destinationCity: "Jbeil",
    status: ShipmentStatus.IN_TRANSIT,
  },
  {
    trackingNumber: "LB-240015",
    customerName: "Joelle Matar",
    customerPhone: "+961 71 845 002",
    destinationCity: "Beirut",
    status: ShipmentStatus.DELIVERED,
  },
  {
    trackingNumber: "LB-240016",
    customerName: "Walid Chamoun",
    customerPhone: "+961 76 263 410",
    destinationCity: "Sin El Fil",
    status: ShipmentStatus.HALTED,
    exceptions: [
      {
        severity: Severity.CRITICAL,
        category: Category.VEHICLE_ISSUE,
        status: ExceptionStatus.ACTIONING,
        rawInput:
          "sar 7adis zghir 3al autostrade, el camion mish 2ader yfut, police 3al makén",
        actionPlan:
          "**Recommended Action Plan — Vehicle Issue (CRITICAL)**\n\n1. Dispatch the nearest backup vehicle to recover the parcels on board.\n2. Move the driver's remaining stops to the relief route.\n3. Log the vehicle fault with the fleet team for inspection.\n\n**ETA impact:** Next-day reschedule likely",
        notificationText:
          "[Priority] Hi! There's a short delay with your delivery due to a vehicle issue on our side. A backup courier is taking over and we'll update you with a new ETA shortly. Thank you for your patience.",
      },
    ],
  },
  {
    trackingNumber: "LB-240017",
    customerName: "Dima Hamdan",
    customerPhone: "+961 71 077 985",
    destinationCity: "Chtaura",
    status: ShipmentStatus.DISPATCHED,
  },
  {
    trackingNumber: "LB-240018",
    customerName: "Elias Boutros",
    customerPhone: "+961 03 412 668",
    destinationCity: "Dbayeh",
    status: ShipmentStatus.IN_TRANSIT,
  },
];

async function main() {
  console.log("Resetting existing data…");
  // Order matters because of FK constraints: logs -> exceptions -> shipments.
  await prisma.auditLog.deleteMany();
  await prisma.exception.deleteMany();
  await prisma.shipment.deleteMany();

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
          status: exceptionSeed.status,
          rawInput: exceptionSeed.rawInput,
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
          newState: `${exception.status} (${exception.severity}/${exception.category})`,
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
